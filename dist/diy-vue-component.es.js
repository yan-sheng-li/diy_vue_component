import { ElButton as s } from "element-plus";
import { resolveComponent as d, createBlock as c, openBlock as i, withCtx as r, renderSlot as f } from "vue";
const p = (e, o) => {
  const t = e.__vccOpts || e;
  for (const [n, a] of o)
    t[n] = a;
  return t;
}, u = {
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
function m(e, o, t, n, a, B) {
  const l = d("el-button");
  return i(), c(l, {
    type: t.type,
    size: t.size,
    disabled: t.disabled,
    loading: t.loading
  }, {
    default: r(() => [
      f(e.$slots, "default")
    ]),
    _: 3
  }, 8, ["type", "size", "disabled", "loading"]);
}
const _ = /* @__PURE__ */ p(u, [["render", m]]), y = [_], g = (e) => {
  y.forEach((o) => e.component(o.name, o));
}, z = { install: g };
export {
  _ as MyButton,
  z as default
};
