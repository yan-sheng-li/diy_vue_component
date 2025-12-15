import { ElButton as s } from "element-plus";
import { resolveComponent as d, createBlock as i, openBlock as r, withCtx as c, renderSlot as u } from "vue";
const f = (e, o) => {
  const t = e.__vccOpts || e;
  for (const [n, a] of o)
    t[n] = a;
  return t;
}, p = {
  name: "MyButton",
  components: {
    ElButton: s
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
function y(e, o, t, n, a, m) {
  const l = d("el-button");
  return r(), i(l, {
    type: t.type,
    size: t.size,
    disabled: t.disabled,
    loading: t.loading
  }, {
    default: c(() => [
      u(e.$slots, "default")
    ]),
    _: 3
  }, 8, ["type", "size", "disabled", "loading"]);
}
const _ = /* @__PURE__ */ f(p, [["render", y]]), b = {
  install(e) {
    e.component("MyButton", _);
  }
};
export {
  _ as MyButton,
  b as default
};
