import { ElButton as d } from "element-plus";
import { resolveComponent as s, createBlock as r, openBlock as i, withCtx as c, renderSlot as f } from "vue";
const u = (e, o) => {
  const t = e.__vccOpts || e;
  for (const [n, a] of o)
    t[n] = a;
  return t;
}, p = {
  name: "MyButton",
  components: {
    ElButton: d
  },
  props: {
    type: {
      type: String,
      default: "primary"
    },
    size: {
      type: String,
      default: "default"
    },
    disabled: {
      type: Boolean,
      default: !1
    },
    loading: {
      type: Boolean,
      default: !1
    }
  }
};
function _(e, o, t, n, a, y) {
  const l = s("el-button");
  return i(), r(l, {
    type: t.type,
    size: t.size,
    disabled: t.disabled,
    loading: t.loading
  }, {
    default: c(() => [
      f(e.$slots, "default")
    ]),
    _: 3
  }, 8, ["type", "size", "disabled", "loading"]);
}
const B = /* @__PURE__ */ u(p, [["render", _]]);
export {
  B as default
};
