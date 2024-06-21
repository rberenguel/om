// Fireworks for Anki templates. It's in this repo because why not

(() => {
  // Needs a div to be observed
  const  targetDiv = document.getElementById("answer") || document.querySelector("div");
  const options = {
    rootMargin: "0px",
    threshold: 0.3,
  };

  const friction = 0.98;

  let particles = []
  let ctx
  let animationRunning = false;

  const answerObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let canvas = document.getElementById("fireworks");
        if(!canvas){
          canvas = document.createElement("canvas")
          document.body.append(canvas)
          canvas.style.backgroundColor = "black"
        }
        canvas.style.zIndex = 10000;
        ctx = canvas.getContext("2d");

        canvas.width = `${window.innerWidth}`;
        canvas.height = `${window.innerHeight}`;

        canvas.style.position = "absolute";
        canvas.style.left = 0;
        canvas.style.top = 0;
        canvas.style.width = null;
        canvas.style.height = null;
        const trigger = (e) => {
          const x = e.touches ? e.touches[0].clientX : e.clientX;
          const y = e.touches ? e.touches[0].clientY : e.clientY;
          explodeFirework(x, y, ctx, canvas);
        }
        canvas.addEventListener("touchmove", trigger);
        canvas.addEventListener("mousemove", trigger);
        canvas.addEventListener("click", trigger);
        observer.unobserve(targetDiv);
      }
    });
  }, options);

  answerObserver.observe(targetDiv);

  function silverColors(count){
    let colors = []
    for(let i=0;i<count;i++){
      const shade = Math.floor(200+Math.random()*55)
      colors.push(`rgb(${shade}, ${shade}, ${shade}, `)
    }
    return colors
  }

  function goldColors(count){
    let colors = []
    for(let i=0;i<count;i++){
      const shade = Math.floor(150+Math.random()*85)
      colors.push(`rgb(${shade}, ${0.8*shade}, 100, `)
    }
    return colors
  }

  function animateParticles() {
    // Clear the canvas after drawing all particles
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      ctx.clearRect(particle.x-2, particle.y-2, 4, 4);
      for(let j=0;j<particle.trail.length;j++){
        const trail = particle.trail[j]
        ctx.clearRect(trail.x-2, trail.y-2, 4, 4);
      }
    }

    particles = particles.filter(p => p.alpha > -5*p.decay);

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      if(particle.alpha > 0.5){
        particle.y -= 25*particle.decay
      } else {
        particle.y += 2*particle.decay
      }
      particle.vx *= friction;
      particle.vy *= friction;
      particle.alpha -= particle.decay;

      particle.trailLength = 5+Math.random()*10;
      particle.trail.push({
        x: particle.x,
        y: particle.y,
        alpha: particle.alpha,
      });

      // Limit trail length
      if (particle.trail.length > particle.trailLength) {
        particle.trail.shift();
      }
      for (let j = 0; j < particle.trail.length; j++) {
        const trailPoint = particle.trail[j];
        ctx.beginPath();
        ctx.arc(trailPoint.x, trailPoint.y, particle.radius, 0, Math.PI * 2);
        if(particle.alpha >= -4*particle.decay && particle.alpha <= 0){
          ctx.fillStyle = particle.explodeColor + ")"
        } else if(particle.alpha <= -5*particle.decay){
          continue
        } else {
          ctx.fillStyle = particle.color + trailPoint.alpha + ")";
        }
        ctx.fill();
      }
      if (particle.alpha > 0) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + 4*particle.alpha + ")";
        ctx.fill();
      }
      if(particle.alpha <= -5*particle.decay){
        for(let j=0;j<particle.trail.length;j++){
          const trail = particle.trail[j]
          ctx.clearRect(trail.x-2, trail.y-2, 4, 4);
        }
        particle.trail = []
      }
    }
    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    } else {
      animationRunning = false;
    }
  }

  function rgb(c){
    const lv = 150+Math.random()*100
    return `rgb(${c[0]*lv}, ${c[1]*lv}, ${c[2]*lv}`
  }

  function explodeFirework(x, y, ctx, canvas) {
    const particlesLength = 15+Math.random()*25; // Number of particles

    const rainbow = [[1, 0, 0], [1, 0.5, 0], [1, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 1]].map(rgb);
    const silver = silverColors((4+Math.random()*4))
    const blue = [[0.4,0.4,1.5], [0.2,0.2,1.5], [0.3,0.3,1.5], [0.6,0.6,1.5], [0, 0.8, 1.5]].map(rgb)
    const red = [[1.4,0.4,0.4], [1.4,0.2,0.2], [1.5,0.3,0.3], [1.5,0.6,0.6], [1.5, 0.8, 0.3]].map(rgb)
    const yellow = [[1.4,1.4,0.4], [1.4,1.2,0.2], [1.5,1.3,0.3], [1.5,1.6,0.6], [1.5, 1.8, 0.3]].map(rgb)
    const gold = goldColors((4+Math.random()*4))
    const colorMap = [[gold, yellow], [gold, red], [gold, gold], [silver, silver], [silver, blue], [silver, yellow], [rainbow, rainbow]]
    const colors = colorMap[Math.floor(Math.random()*colorMap.length)]
    for (let i = 0; i < particlesLength; i++) {
      const angle = (i / particlesLength) * Math.PI * 2;
      const speed = Math.random() * 0.8 + Math.random() * 0.4;

      const particle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[0][Math.floor(Math.random() * colors[0].length)],
        explodeColor: colors[1][Math.floor(Math.random() * colors[1].length)],
        radius: 1,
        alpha: 1,
        decay: Math.random() * 0.005 + 0.007,
        trail: [],
      };
      particles.push(particle);
    }
    if (!animationRunning) {
      animationRunning = true;
      requestAnimationFrame(animateParticles);
    }
  }

  requestAnimationFrame(animateParticles);
})()
