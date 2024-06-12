/**
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/ts-fsrs@3.5.7/dist/index.mjs
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
import t from "./seedrandom.js";
var e = ((t) => (
    (t[(t.New = 0)] = "New"),
    (t[(t.Learning = 1)] = "Learning"),
    (t[(t.Review = 2)] = "Review"),
    (t[(t.Relearning = 3)] = "Relearning"),
    t
  ))(e || {}),
  a = ((t) => (
    (t[(t.Manual = 0)] = "Manual"),
    (t[(t.Again = 1)] = "Again"),
    (t[(t.Hard = 2)] = "Hard"),
    (t[(t.Good = 3)] = "Good"),
    (t[(t.Easy = 4)] = "Easy"),
    t
  ))(a || {});
(Date.prototype.scheduler = function (t, e) {
  return i(this, t, e);
}),
  (Date.prototype.diff = function (t, e) {
    return s(this, t, e);
  }),
  (Date.prototype.format = function () {
    return r(this);
  }),
  (Date.prototype.dueFormat = function (t, e, a) {
    return o(this, t, e, a);
  });
function i(t, e, a) {
  return new Date(
    a ? h(t).getTime() + e * 24 * 60 * 60 * 1e3 : h(t).getTime() + e * 60 * 1e3,
  );
}
function s(t, e, a) {
  if (!t || !e) throw new Error("Invalid date");
  const i = h(t).getTime() - h(e).getTime();
  let s = 0;
  switch (a) {
    case "days":
      s = Math.floor(i / (24 * 60 * 60 * 1e3));
      break;
    case "minutes":
      s = Math.floor(i / (60 * 1e3));
      break;
  }
  return s;
}
function r(t) {
  const e = h(t),
    a = e.getFullYear(),
    i = e.getMonth() + 1,
    s = e.getDate(),
    r = e.getHours(),
    d = e.getMinutes(),
    l = e.getSeconds();
  return `${a}-${n(i)}-${n(s)} ${n(r)}:${n(d)}:${n(l)}`;
}
function n(t) {
  return t < 10 ? `0${t}` : `${t}`;
}
const d = [60, 60, 24, 31, 12],
  l = ["second", "min", "hour", "day", "month", "year"];
function o(t, e, a, i = l) {
  (t = h(t)), (e = h(e)), i.length !== l.length && (i = l);
  let s = t.getTime() - e.getTime(),
    r;
  for (s /= 1e3, r = 0; r < d.length && !(s < d[r]); r++) s /= d[r];
  return `${Math.floor(s)}${a ? i[r] : ""}`;
}
function h(t) {
  if (typeof t == "object" && t instanceof Date) return t;
  if (typeof t == "string") {
    const e = Date.parse(t);
    if (isNaN(e)) throw new Error(`Invalid date:[${t}]`);
    return new Date(e);
  } else if (typeof t == "number") return new Date(t);
  throw new Error(`Invalid date:[${t}]`);
}
function u(t) {
  if (typeof t == "string") {
    const a = t.charAt(0).toUpperCase(),
      i = t.slice(1).toLowerCase(),
      s = e[`${a}${i}`];
    if (s === void 0) throw new Error(`Invalid state:[${t}]`);
    return s;
  } else if (typeof t == "number") return t;
  throw new Error(`Invalid state:[${t}]`);
}
function c(t) {
  if (typeof t == "string") {
    const e = t.charAt(0).toUpperCase(),
      i = t.slice(1).toLowerCase(),
      s = a[`${e}${i}`];
    if (s === void 0) throw new Error(`Invalid rating:[${t}]`);
    return s;
  } else if (typeof t == "number") return t;
  throw new Error(`Invalid rating:[${t}]`);
}
const y = [a.Again, a.Hard, a.Good, a.Easy],
  f = [
    { start: 2.5, end: 7, factor: 0.15 },
    { start: 7, end: 20, factor: 0.1 },
    { start: 20, end: 1 / 0, factor: 0.05 },
  ];
function _(t, e, a) {
  let i = 1;
  for (const e of f) i += e.factor * Math.max(Math.min(t, e.end) - e.start, 0);
  t = Math.min(t, a);
  let s = Math.max(2, Math.round(t - i));
  const r = Math.min(Math.round(t + i), a);
  return (
    t > e && (s = Math.max(s, e + 1)),
    (s = Math.min(s, r)),
    { min_ivl: s, max_ivl: r }
  );
}
class p {
  again;
  hard;
  good;
  easy;
  last_review;
  last_elapsed_days;
  copy(t) {
    return { ...t };
  }
  constructor(t, a) {
    (this.last_review = t.last_review || t.due),
      (this.last_elapsed_days = t.elapsed_days),
      (t.elapsed_days = t.state === e.New ? 0 : a.diff(t.last_review, "days")),
      (t.last_review = a),
      (t.reps += 1),
      (this.again = this.copy(t)),
      (this.hard = this.copy(t)),
      (this.good = this.copy(t)),
      (this.easy = this.copy(t));
  }
  update_state(t) {
    return (
      t === e.New
        ? ((this.again.state = e.Learning),
          (this.hard.state = e.Learning),
          (this.good.state = e.Learning),
          (this.easy.state = e.Review))
        : t === e.Learning || t === e.Relearning
          ? ((this.again.state = t),
            (this.hard.state = t),
            (this.good.state = e.Review),
            (this.easy.state = e.Review))
          : t === e.Review &&
            ((this.again.state = e.Relearning),
            (this.hard.state = e.Review),
            (this.good.state = e.Review),
            (this.easy.state = e.Review),
            (this.again.lapses += 1)),
      this
    );
  }
  schedule(t, e, a, s) {
    return (
      (this.again.scheduled_days = 0),
      (this.hard.scheduled_days = e),
      (this.good.scheduled_days = a),
      (this.easy.scheduled_days = s),
      (this.again.due = i(t, 5)),
      (this.hard.due = e > 0 ? i(t, e, !0) : i(t, 10)),
      (this.good.due = i(t, a, !0)),
      (this.easy.due = i(t, s, !0)),
      this
    );
  }
  record_log(t, e) {
    return {
      [a.Again]: {
        card: this.again,
        log: {
          rating: a.Again,
          state: t.state,
          due: this.last_review,
          stability: t.stability,
          difficulty: t.difficulty,
          elapsed_days: t.elapsed_days,
          last_elapsed_days: this.last_elapsed_days,
          scheduled_days: t.scheduled_days,
          review: e,
        },
      },
      [a.Hard]: {
        card: this.hard,
        log: {
          rating: a.Hard,
          state: t.state,
          due: this.last_review,
          stability: t.stability,
          difficulty: t.difficulty,
          elapsed_days: t.elapsed_days,
          last_elapsed_days: this.last_elapsed_days,
          scheduled_days: t.scheduled_days,
          review: e,
        },
      },
      [a.Good]: {
        card: this.good,
        log: {
          rating: a.Good,
          state: t.state,
          due: this.last_review,
          stability: t.stability,
          difficulty: t.difficulty,
          elapsed_days: t.elapsed_days,
          last_elapsed_days: this.last_elapsed_days,
          scheduled_days: t.scheduled_days,
          review: e,
        },
      },
      [a.Easy]: {
        card: this.easy,
        log: {
          rating: a.Easy,
          state: t.state,
          due: this.last_review,
          stability: t.stability,
          difficulty: t.difficulty,
          elapsed_days: t.elapsed_days,
          last_elapsed_days: this.last_elapsed_days,
          scheduled_days: t.scheduled_days,
          review: e,
        },
      },
    };
  }
}
const g = 0.9,
  w = 36500,
  m = [
    0.5701, 1.4436, 4.1386, 10.9355, 5.1443, 1.2006, 0.8627, 0.0362, 1.629,
    0.1342, 1.0166, 2.1174, 0.0839, 0.3204, 1.4676, 0.219, 2.8237,
  ],
  v = !1,
  b = "3.5.7",
  x = (t) => ({
    request_retention: (t == null ? void 0 : t.request_retention) || g,
    maximum_interval: (t == null ? void 0 : t.maximum_interval) || w,
    w: (t == null ? void 0 : t.w) || m,
    enable_fuzz: (t == null ? void 0 : t.enable_fuzz) || v,
  });
function M(t, a) {
  const i = {
    due: t ? h(t) : new Date(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: e.New,
    last_review: void 0,
  };
  return a && typeof a == "function" ? a(i) : i;
}
const R = -0.5,
  E = 19 / 81;
class $ {
  param;
  intervalModifier;
  seed;
  constructor(t) {
    (this.param = new Proxy(x(t), this.params_handler_proxy())),
      (this.intervalModifier = this.calculate_interval_modifier(
        this.param.request_retention,
      ));
  }
  get interval_modifier() {
    return this.intervalModifier;
  }
  calculate_interval_modifier(t) {
    if (t <= 0 || t > 1)
      throw new Error("Requested retention rate should be in the range (0,1]");
    return +((Math.pow(t, 1 / R) - 1) / E).toFixed(8);
  }
  get parameters() {
    return this.param;
  }
  set parameters(t) {
    this.update_parameters(t);
  }
  params_handler_proxy() {
    const t = this;
    return {
      set: function (e, a, i) {
        return (
          a === "request_retention" &&
            Number.isFinite(i) &&
            (t.intervalModifier = t.calculate_interval_modifier(Number(i))),
          (e[a] = i),
          !0
        );
      },
    };
  }
  update_parameters(t) {
    const e = x(t);
    for (const t in e)
      if (t in this.param) {
        const a = t;
        this.param[a] = e[a];
      }
  }
  init_ds(t) {
    (t.again.difficulty = this.init_difficulty(a.Again)),
      (t.again.stability = this.init_stability(a.Again)),
      (t.hard.difficulty = this.init_difficulty(a.Hard)),
      (t.hard.stability = this.init_stability(a.Hard)),
      (t.good.difficulty = this.init_difficulty(a.Good)),
      (t.good.stability = this.init_stability(a.Good)),
      (t.easy.difficulty = this.init_difficulty(a.Easy)),
      (t.easy.stability = this.init_stability(a.Easy));
  }
  next_ds(t, e, i, s) {
    (t.again.difficulty = this.next_difficulty(e, a.Again)),
      (t.again.stability = this.next_forget_stability(e, i, s)),
      (t.hard.difficulty = this.next_difficulty(e, a.Hard)),
      (t.hard.stability = this.next_recall_stability(e, i, s, a.Hard)),
      (t.good.difficulty = this.next_difficulty(e, a.Good)),
      (t.good.stability = this.next_recall_stability(e, i, s, a.Good)),
      (t.easy.difficulty = this.next_difficulty(e, a.Easy)),
      (t.easy.stability = this.next_recall_stability(e, i, s, a.Easy));
  }
  init_stability(t) {
    return Math.max(this.param.w[t - 1], 0.1);
  }
  init_difficulty(t) {
    return +Math.min(
      Math.max(this.param.w[4] - (t - 3) * this.param.w[5], 1),
      10,
    ).toFixed(8);
  }
  apply_fuzz(e, a, i) {
    if (!i || e < 2.5) return Math.round(e);
    const s = t(this.seed)(),
      { min_ivl: r, max_ivl: n } = _(e, a, this.param.maximum_interval);
    return Math.floor(s * (n - r + 1) + r);
  }
  next_interval(t, e, a = this.param.enable_fuzz) {
    const i = Math.min(
      Math.max(1, Math.round(t * this.intervalModifier)),
      this.param.maximum_interval,
    );
    return this.apply_fuzz(i, e, a);
  }
  next_difficulty(t, e) {
    const a = t - this.param.w[6] * (e - 3);
    return this.constrain_difficulty(this.mean_reversion(this.param.w[4], a));
  }
  constrain_difficulty(t) {
    return Math.min(Math.max(+t.toFixed(8), 1), 10);
  }
  mean_reversion(t, e) {
    return +(this.param.w[7] * t + (1 - this.param.w[7]) * e).toFixed(8);
  }
  next_recall_stability(t, e, i, s) {
    const r = a.Hard === s ? this.param.w[15] : 1,
      n = a.Easy === s ? this.param.w[16] : 1;
    return +(
      e *
      (1 +
        Math.exp(this.param.w[8]) *
          (11 - t) *
          Math.pow(e, -this.param.w[9]) *
          (Math.exp((1 - i) * this.param.w[10]) - 1) *
          r *
          n)
    ).toFixed(8);
  }
  next_forget_stability(t, e, a) {
    return +(
      this.param.w[11] *
      Math.pow(t, -this.param.w[12]) *
      (Math.pow(e + 1, this.param.w[13]) - 1) *
      Math.exp((1 - a) * this.param.w[14])
    ).toFixed(8);
  }
  forgetting_curve(t, e) {
    return +Math.pow(1 + (E * t) / e, R).toFixed(8);
  }
}
class D extends $ {
  constructor(t) {
    super(t);
  }
  preProcessCard(t) {
    return {
      ...t,
      state: u(t.state),
      due: h(t.due),
      last_review: t.last_review ? h(t.last_review) : void 0,
    };
  }
  preProcessDate(t) {
    return h(t);
  }
  preProcessLog(t) {
    return {
      ...t,
      due: h(t.due),
      rating: c(t.rating),
      state: u(t.state),
      review: h(t.review),
    };
  }
  repeat(t, a, i) {
    const s = this.preProcessCard(t);
    a = this.preProcessDate(a);
    const r = new p(s, a).update_state(s.state);
    this.seed = String(a.getTime()) + String(s.reps);
    let n, d, l;
    const o = s.elapsed_days;
    switch (s.state) {
      case e.New:
        this.init_ds(r),
          (r.again.due = a.scheduler(1)),
          (r.hard.due = a.scheduler(5)),
          (r.good.due = a.scheduler(10)),
          (n = this.next_interval(r.easy.stability, o)),
          (r.easy.scheduled_days = n),
          (r.easy.due = a.scheduler(n, !0));
        break;
      case e.Learning:
      case e.Relearning:
        (l = 0),
          (d = this.next_interval(r.good.stability, o)),
          (n = Math.max(this.next_interval(r.easy.stability, o), d + 1)),
          r.schedule(a, l, d, n);
        break;
      case e.Review: {
        const t = s.difficulty,
          e = s.stability,
          i = this.forgetting_curve(o, e);
        this.next_ds(r, t, e, i),
          (l = this.next_interval(r.hard.stability, o)),
          (d = this.next_interval(r.good.stability, o)),
          (l = Math.min(l, d)),
          (d = Math.max(d, l + 1)),
          (n = Math.max(this.next_interval(r.easy.stability, o), d + 1)),
          r.schedule(a, l, d, n);
        break;
      }
    }
    const h = r.record_log(s, a);
    return i && typeof i == "function" ? i(h) : h;
  }
  get_retrievability(t, a, i = !0) {
    const s = this.preProcessCard(t);
    if (((a = this.preProcessDate(a)), s.state !== e.Review)) return;
    const r = Math.max(a.diff(s.last_review, "days"), 0),
      n = this.forgetting_curve(r, Math.round(s.stability));
    return i ? `${(n * 100).toFixed(2)}%` : n;
  }
  rollback(t, i, s) {
    const r = this.preProcessCard(t),
      n = this.preProcessLog(i);
    if (n.rating === a.Manual)
      throw new Error("Cannot rollback a manual rating");
    let d, l, o;
    switch (n.state) {
      case e.New:
        (d = n.due), (l = void 0), (o = 0);
        break;
      case e.Learning:
      case e.Relearning:
      case e.Review:
        (d = n.review),
          (l = n.due),
          (o =
            r.lapses - (n.rating === a.Again && n.state === e.Review ? 1 : 0));
        break;
    }
    const h = {
      ...r,
      due: d,
      stability: n.stability,
      difficulty: n.difficulty,
      elapsed_days: n.last_elapsed_days,
      scheduled_days: n.scheduled_days,
      reps: Math.max(0, r.reps - 1),
      lapses: Math.max(0, o),
      state: n.state,
      last_review: l,
    };
    return s && typeof s == "function" ? s(h) : h;
  }
  forget(t, i, s = !1, r) {
    const n = this.preProcessCard(t);
    i = this.preProcessDate(i);
    const d = n.state === e.New ? 0 : i.diff(n.last_review, "days"),
      l = {
        rating: a.Manual,
        state: n.state,
        due: n.due,
        stability: n.stability,
        difficulty: n.difficulty,
        elapsed_days: 0,
        last_elapsed_days: n.elapsed_days,
        scheduled_days: d,
        review: i,
      },
      o = {
        card: {
          ...n,
          due: i,
          stability: 0,
          difficulty: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: s ? 0 : n.reps,
          lapses: s ? 0 : n.lapses,
          state: e.New,
          last_review: n.last_review,
        },
        log: l,
      };
    return r && typeof r == "function" ? r(o) : o;
  }
  reschedule(t, a = {}) {
    if (!Array.isArray(t)) throw new Error("cards must be an array");
    const s = [];
    for (const r of t) {
      if (u(r.state) !== e.Review || !r.last_review) continue;
      const t = Math.floor(r.scheduled_days),
        n = this.next_interval(
          +r.stability.toFixed(2),
          Math.round(r.elapsed_days),
          a.enable_fuzz ?? !0,
        );
      if (n === t || n === 0) continue;
      const d = { ...r };
      d.scheduled_days = n;
      const l = i(d.last_review, n, !0);
      a.dateHandler && typeof a.dateHandler == "function"
        ? (d.due = a.dateHandler(l))
        : (d.due = l),
        s.push(d);
    }
    return s;
  }
}
const z = (t) => new D(t || {});
export {
  R as DECAY,
  E as FACTOR,
  D as FSRS,
  $ as FSRSAlgorithm,
  b as FSRSVersion,
  y as Grades,
  a as Rating,
  p as SchedulingCard,
  e as State,
  M as createEmptyCard,
  s as date_diff,
  i as date_scheduler,
  v as default_enable_fuzz,
  w as default_maximum_interval,
  g as default_request_retention,
  m as default_w,
  h as fixDate,
  c as fixRating,
  u as fixState,
  r as formatDate,
  z as fsrs,
  x as generatorParameters,
  _ as get_fuzz_range,
  o as show_diff_message,
};
export default null;
