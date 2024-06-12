/**
 * Required by fsrs
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/seedrandom@3.0.5/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var t =
    "undefined" != typeof globalThis
      ? globalThis
      : "undefined" != typeof window
        ? window
        : "undefined" != typeof global
          ? global
          : "undefined" != typeof self
            ? self
            : {},
  n = { exports: {} };
!(function (t, n, r) {
  function e(t) {
    var n = this,
      r = (function () {
        var t = 4022871197,
          n = function (n) {
            n = String(n);
            for (var r = 0; r < n.length; r++) {
              var e = 0.02519603282416938 * (t += n.charCodeAt(r));
              (e -= t = e >>> 0),
                (t = (e *= t) >>> 0),
                (t += 4294967296 * (e -= t));
            }
            return 2.3283064365386963e-10 * (t >>> 0);
          };
        return n;
      })();
    (n.next = function () {
      var t = 2091639 * n.s0 + 2.3283064365386963e-10 * n.c;
      return (n.s0 = n.s1), (n.s1 = n.s2), (n.s2 = t - (n.c = 0 | t));
    }),
      (n.c = 1),
      (n.s0 = r(" ")),
      (n.s1 = r(" ")),
      (n.s2 = r(" ")),
      (n.s0 -= r(t)),
      n.s0 < 0 && (n.s0 += 1),
      (n.s1 -= r(t)),
      n.s1 < 0 && (n.s1 += 1),
      (n.s2 -= r(t)),
      n.s2 < 0 && (n.s2 += 1),
      (r = null);
  }
  function o(t, n) {
    return (n.c = t.c), (n.s0 = t.s0), (n.s1 = t.s1), (n.s2 = t.s2), n;
  }
  function u(t, n) {
    var r = new e(t),
      u = n && n.state,
      i = r.next;
    return (
      (i.int32 = function () {
        return (4294967296 * r.next()) | 0;
      }),
      (i.double = function () {
        return i() + 11102230246251565e-32 * ((2097152 * i()) | 0);
      }),
      (i.quick = i),
      u &&
        ("object" == typeof u && o(u, r),
        (i.state = function () {
          return o(r, {});
        })),
      i
    );
  }
  n && n.exports
    ? (n.exports = u)
    : r && r.amd
      ? r(function () {
          return u;
        })
      : (this.alea = u);
})(0, n, !1);
var r = { exports: {} };
!(function (t, n, r) {
  function e(t) {
    var n = this,
      r = "";
    (n.x = 0),
      (n.y = 0),
      (n.z = 0),
      (n.w = 0),
      (n.next = function () {
        var t = n.x ^ (n.x << 11);
        return (
          (n.x = n.y),
          (n.y = n.z),
          (n.z = n.w),
          (n.w ^= (n.w >>> 19) ^ t ^ (t >>> 8))
        );
      }),
      t === (0 | t) ? (n.x = t) : (r += t);
    for (var e = 0; e < r.length + 64; e++)
      (n.x ^= 0 | r.charCodeAt(e)), n.next();
  }
  function o(t, n) {
    return (n.x = t.x), (n.y = t.y), (n.z = t.z), (n.w = t.w), n;
  }
  function u(t, n) {
    var r = new e(t),
      u = n && n.state,
      i = function () {
        return (r.next() >>> 0) / 4294967296;
      };
    return (
      (i.double = function () {
        do {
          var t =
            ((r.next() >>> 11) + (r.next() >>> 0) / 4294967296) / (1 << 21);
        } while (0 === t);
        return t;
      }),
      (i.int32 = r.next),
      (i.quick = i),
      u &&
        ("object" == typeof u && o(u, r),
        (i.state = function () {
          return o(r, {});
        })),
      i
    );
  }
  n && n.exports
    ? (n.exports = u)
    : r && r.amd
      ? r(function () {
          return u;
        })
      : (this.xor128 = u);
})(0, r, !1);
var e = { exports: {} };
!(function (t, n, r) {
  function e(t) {
    var n = this,
      r = "";
    (n.next = function () {
      var t = n.x ^ (n.x >>> 2);
      return (
        (n.x = n.y),
        (n.y = n.z),
        (n.z = n.w),
        (n.w = n.v),
        ((n.d = (n.d + 362437) | 0) + (n.v = n.v ^ (n.v << 4) ^ t ^ (t << 1))) |
          0
      );
    }),
      (n.x = 0),
      (n.y = 0),
      (n.z = 0),
      (n.w = 0),
      (n.v = 0),
      t === (0 | t) ? (n.x = t) : (r += t);
    for (var e = 0; e < r.length + 64; e++)
      (n.x ^= 0 | r.charCodeAt(e)),
        e == r.length && (n.d = (n.x << 10) ^ (n.x >>> 4)),
        n.next();
  }
  function o(t, n) {
    return (
      (n.x = t.x),
      (n.y = t.y),
      (n.z = t.z),
      (n.w = t.w),
      (n.v = t.v),
      (n.d = t.d),
      n
    );
  }
  function u(t, n) {
    var r = new e(t),
      u = n && n.state,
      i = function () {
        return (r.next() >>> 0) / 4294967296;
      };
    return (
      (i.double = function () {
        do {
          var t =
            ((r.next() >>> 11) + (r.next() >>> 0) / 4294967296) / (1 << 21);
        } while (0 === t);
        return t;
      }),
      (i.int32 = r.next),
      (i.quick = i),
      u &&
        ("object" == typeof u && o(u, r),
        (i.state = function () {
          return o(r, {});
        })),
      i
    );
  }
  n && n.exports
    ? (n.exports = u)
    : r && r.amd
      ? r(function () {
          return u;
        })
      : (this.xorwow = u);
})(0, e, !1);
var o = { exports: {} };
!(function (t, n, r) {
  function e(t) {
    var n = this;
    (n.next = function () {
      var t,
        r,
        e = n.x,
        o = n.i;
      return (
        (t = e[o]),
        (r = (t ^= t >>> 7) ^ (t << 24)),
        (r ^= (t = e[(o + 1) & 7]) ^ (t >>> 10)),
        (r ^= (t = e[(o + 3) & 7]) ^ (t >>> 3)),
        (r ^= (t = e[(o + 4) & 7]) ^ (t << 7)),
        (t = e[(o + 7) & 7]),
        (r ^= (t ^= t << 13) ^ (t << 9)),
        (e[o] = r),
        (n.i = (o + 1) & 7),
        r
      );
    }),
      (function (t, n) {
        var r,
          e = [];
        if (n === (0 | n)) e[0] = n;
        else
          for (n = "" + n, r = 0; r < n.length; ++r)
            e[7 & r] =
              (e[7 & r] << 15) ^ ((n.charCodeAt(r) + e[(r + 1) & 7]) << 13);
        for (; e.length < 8; ) e.push(0);
        for (r = 0; r < 8 && 0 === e[r]; ++r);
        for (8 == r ? (e[7] = -1) : e[r], t.x = e, t.i = 0, r = 256; r > 0; --r)
          t.next();
      })(n, t);
  }
  function o(t, n) {
    return (n.x = t.x.slice()), (n.i = t.i), n;
  }
  function u(t, n) {
    null == t && (t = +new Date());
    var r = new e(t),
      u = n && n.state,
      i = function () {
        return (r.next() >>> 0) / 4294967296;
      };
    return (
      (i.double = function () {
        do {
          var t =
            ((r.next() >>> 11) + (r.next() >>> 0) / 4294967296) / (1 << 21);
        } while (0 === t);
        return t;
      }),
      (i.int32 = r.next),
      (i.quick = i),
      u &&
        (u.x && o(u, r),
        (i.state = function () {
          return o(r, {});
        })),
      i
    );
  }
  n && n.exports
    ? (n.exports = u)
    : r && r.amd
      ? r(function () {
          return u;
        })
      : (this.xorshift7 = u);
})(0, o, !1);
var u = { exports: {} };
!(function (t, n, r) {
  function e(t) {
    var n = this;
    (n.next = function () {
      var t,
        r,
        e = n.w,
        o = n.X,
        u = n.i;
      return (
        (n.w = e = (e + 1640531527) | 0),
        (r = o[(u + 34) & 127]),
        (t = o[(u = (u + 1) & 127)]),
        (r ^= r << 13),
        (t ^= t << 17),
        (r ^= r >>> 15),
        (t ^= t >>> 12),
        (r = o[u] = r ^ t),
        (n.i = u),
        (r + (e ^ (e >>> 16))) | 0
      );
    }),
      (function (t, n) {
        var r,
          e,
          o,
          u,
          i,
          f = [],
          a = 128;
        for (
          n === (0 | n)
            ? ((e = n), (n = null))
            : ((n += "\0"), (e = 0), (a = Math.max(a, n.length))),
            o = 0,
            u = -32;
          u < a;
          ++u
        )
          n && (e ^= n.charCodeAt((u + 32) % n.length)),
            0 === u && (i = e),
            (e ^= e << 10),
            (e ^= e >>> 15),
            (e ^= e << 4),
            (e ^= e >>> 13),
            u >= 0 &&
              ((i = (i + 1640531527) | 0),
              (o = 0 == (r = f[127 & u] ^= e + i) ? o + 1 : 0));
        for (
          o >= 128 && (f[127 & ((n && n.length) || 0)] = -1), o = 127, u = 512;
          u > 0;
          --u
        )
          (e = f[(o + 34) & 127]),
            (r = f[(o = (o + 1) & 127)]),
            (e ^= e << 13),
            (r ^= r << 17),
            (e ^= e >>> 15),
            (r ^= r >>> 12),
            (f[o] = e ^ r);
        (t.w = i), (t.X = f), (t.i = o);
      })(n, t);
  }
  function o(t, n) {
    return (n.i = t.i), (n.w = t.w), (n.X = t.X.slice()), n;
  }
  function u(t, n) {
    null == t && (t = +new Date());
    var r = new e(t),
      u = n && n.state,
      i = function () {
        return (r.next() >>> 0) / 4294967296;
      };
    return (
      (i.double = function () {
        do {
          var t =
            ((r.next() >>> 11) + (r.next() >>> 0) / 4294967296) / (1 << 21);
        } while (0 === t);
        return t;
      }),
      (i.int32 = r.next),
      (i.quick = i),
      u &&
        (u.X && o(u, r),
        (i.state = function () {
          return o(r, {});
        })),
      i
    );
  }
  n && n.exports
    ? (n.exports = u)
    : r && r.amd
      ? r(function () {
          return u;
        })
      : (this.xor4096 = u);
})(0, u, !1);
var i = { exports: {} };
!(function (t, n, r) {
  function e(t) {
    var n = this,
      r = "";
    (n.next = function () {
      var t = n.b,
        r = n.c,
        e = n.d,
        o = n.a;
      return (
        (t = (t << 25) ^ (t >>> 7) ^ r),
        (r = (r - e) | 0),
        (e = (e << 24) ^ (e >>> 8) ^ o),
        (o = (o - t) | 0),
        (n.b = t = (t << 20) ^ (t >>> 12) ^ r),
        (n.c = r = (r - e) | 0),
        (n.d = (e << 16) ^ (r >>> 16) ^ o),
        (n.a = (o - t) | 0)
      );
    }),
      (n.a = 0),
      (n.b = 0),
      (n.c = -1640531527),
      (n.d = 1367130551),
      t === Math.floor(t)
        ? ((n.a = (t / 4294967296) | 0), (n.b = 0 | t))
        : (r += t);
    for (var e = 0; e < r.length + 20; e++)
      (n.b ^= 0 | r.charCodeAt(e)), n.next();
  }
  function o(t, n) {
    return (n.a = t.a), (n.b = t.b), (n.c = t.c), (n.d = t.d), n;
  }
  function u(t, n) {
    var r = new e(t),
      u = n && n.state,
      i = function () {
        return (r.next() >>> 0) / 4294967296;
      };
    return (
      (i.double = function () {
        do {
          var t =
            ((r.next() >>> 11) + (r.next() >>> 0) / 4294967296) / (1 << 21);
        } while (0 === t);
        return t;
      }),
      (i.int32 = r.next),
      (i.quick = i),
      u &&
        ("object" == typeof u && o(u, r),
        (i.state = function () {
          return o(r, {});
        })),
      i
    );
  }
  n && n.exports
    ? (n.exports = u)
    : r && r.amd
      ? r(function () {
          return u;
        })
      : (this.tychei = u);
})(0, i, !1);
var f,
  a = { exports: {} };
(f = a),
  (function (t, n, r) {
    var e,
      o = 256,
      u = "random",
      i = r.pow(o, 6),
      a = r.pow(2, 52),
      c = 2 * a,
      s = o - 1;
    function x(f, s, x) {
      var w = [],
        y = h(
          d(
            (s = 1 == s ? { entropy: !0 } : s || {}).entropy
              ? [f, p(n)]
              : null == f
                ? (function () {
                    try {
                      var r;
                      return (
                        e && (r = e.randomBytes)
                          ? (r = r(o))
                          : ((r = new Uint8Array(o)),
                            (t.crypto || t.msCrypto).getRandomValues(r)),
                        p(r)
                      );
                    } catch (r) {
                      var u = t.navigator,
                        i = u && u.plugins;
                      return [+new Date(), t, i, t.screen, p(n)];
                    }
                  })()
                : f,
            3,
          ),
          w,
        ),
        g = new l(w),
        b = function () {
          for (var t = g.g(6), n = i, r = 0; t < a; )
            (t = (t + r) * o), (n *= o), (r = g.g(1));
          for (; t >= c; ) (t /= 2), (n /= 2), (r >>>= 1);
          return (t + r) / n;
        };
      return (
        (b.int32 = function () {
          return 0 | g.g(4);
        }),
        (b.quick = function () {
          return g.g(4) / 4294967296;
        }),
        (b.double = b),
        h(p(g.S), n),
        (
          s.pass ||
          x ||
          function (t, n, e, o) {
            return (
              o &&
                (o.S && v(o, g),
                (t.state = function () {
                  return v(g, {});
                })),
              e ? ((r[u] = t), n) : t
            );
          }
        )(b, y, "global" in s ? s.global : this == r, s.state)
      );
    }
    function l(t) {
      var n,
        r = t.length,
        e = this,
        u = 0,
        i = (e.i = e.j = 0),
        f = (e.S = []);
      for (r || (t = [r++]); u < o; ) f[u] = u++;
      for (u = 0; u < o; u++)
        (f[u] = f[(i = s & (i + t[u % r] + (n = f[u])))]), (f[i] = n);
      (e.g = function (t) {
        for (var n, r = 0, u = e.i, i = e.j, f = e.S; t--; )
          (n = f[(u = s & (u + 1))]),
            (r = r * o + f[s & ((f[u] = f[(i = s & (i + n))]) + (f[i] = n))]);
        return (e.i = u), (e.j = i), r;
      })(o);
    }
    function v(t, n) {
      return (n.i = t.i), (n.j = t.j), (n.S = t.S.slice()), n;
    }
    function d(t, n) {
      var r,
        e = [],
        o = typeof t;
      if (n && "object" == o)
        for (r in t)
          try {
            e.push(d(t[r], n - 1));
          } catch (t) {}
      return e.length ? e : "string" == o ? t : t + "\0";
    }
    function h(t, n) {
      for (var r, e = t + "", o = 0; o < e.length; )
        n[s & o] = s & ((r ^= 19 * n[s & o]) + e.charCodeAt(o++));
      return p(n);
    }
    function p(t) {
      return String.fromCharCode.apply(0, t);
    }
    if ((h(r.random(), n), f.exports)) {
      f.exports = x;
      try {
        e = require("crypto");
      } catch (t) {}
    } else r["seed" + u] = x;
  })("undefined" != typeof self ? self : t, [], Math);
var c = n.exports,
  s = r.exports,
  x = e.exports,
  l = o.exports,
  v = u.exports,
  d = i.exports,
  h = a.exports;
(h.alea = c),
  (h.xor128 = s),
  (h.xorwow = x),
  (h.xorshift7 = l),
  (h.xor4096 = v),
  (h.tychei = d);
var p = h;
export { p as default };
