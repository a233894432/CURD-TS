/** 
<template>
  <table cellspacing="0" cellpadding="0">
    <tbody>
      <tr>
        <td
          v-for="(item, key) in max"
          :data-index="HsKey"
          :ref="'hstd' + HsKey + key"
          :class="['hs-select__item' + key]"
          @mousemove.prevent="setCurrentValue(key, $event)"
          @mouseleave.prevent="resetCurrentValue(key)"
          @click="selectValue(key, item)"
          :style="{ cursor: rateDisabled ? 'auto' : 'pointer', 'text-align': 'center' }"
          :key="key"
        >
          <div :ref="'hsdiv' + HsKey + key" :class="[classes[key] + key]" class="hs-item">
            <span>{{item}}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang='ts'>
import {
  defineComponent,
  computed,
  nextTick,
  onBeforeMount,
  getCurrentInstance,
} from "vue";
import { addClass, removeClass, toggleClass } from "/@/utils/operate";

// 选中非选中状态
let stayClass = "stay"; //鼠标点击
let activeClass = "hs-on"; //鼠标移动上去
let voidClass = "hs-off"; //鼠标移开
let inRange = "hs-range"; //当前选中的两个元素之间的背景
let bothLeftSides = "both-left-sides";
let bothRightSides = "both-right-sides";
let selectedDirection = "right"; //默认从左往右，索引变大

// 存放第一个选中的元素和最后一个选中元素，只能存放这两个元素
let selectedList = [];

let overList = [];

export default defineComponent({
  name: "Selector",
  props: {
    HsKey: {
      type: Number || String,
      default: 0,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 10,
    },
    // 回显数据的索引，长度必须是2
    echo: {
      type: Array,
      default: [],
    },
  },
  emits: ["selectedVal"],
  setup(props, { emit }) {
    let vm: any;
    let currentValue = props.value;

    let rateDisabled = computed(() => {
      return props.disabled;
    });

    let classes = computed(() => {
      let result = [];
      let i = 0;
      let threshold = currentValue;
      if (currentValue !== Math.floor(currentValue)) {
        threshold--;
      }
      for (; i < threshold; i++) {
        result.push(activeClass);
      }
      for (; i < props.max; i++) {
        result.push(voidClass);
      }
      return result;
    });

    // 鼠标移入
    const setCurrentValue = (index, event) => {
      if (props.disabled) return;
      // 当选中一个元素后，开始添加背景色
      if (selectedList.length === 1) {
        if (overList.length < 1) overList.push({ index });

        let firstIndex = overList[0].index;

        // 往右走，索引变大
        if (index > firstIndex) {
          selectedDirection = "right";
          toggleClass(
            false,
            bothRightSides,
            document.querySelector(".hs-select__item" + selectedList[0].index)
          );

          while (index >= firstIndex) {
            addClass(
              document.querySelector(".hs-select__item" + firstIndex),
              inRange
            );
            firstIndex++;
          }
        } else {
          selectedDirection = "left";
          toggleClass(
            true,
            bothRightSides,
            document.querySelector(".hs-select__item" + selectedList[0].index)
          );

          while (index <= firstIndex) {
            addClass(
              document.querySelector(".hs-select__item" + firstIndex),
              inRange
            );
            firstIndex--;
          }
        }
      }

      addClass(document.querySelector("." + voidClass + index), activeClass);
    };

    // 鼠标离开
    const resetCurrentValue = (index) => {
      if (props.disabled) return;
      // 移除先检查是否选中 选中则返回false 不移除
      const currentHsDom = document.querySelector("." + voidClass + index);
      if (currentHsDom.className.includes(stayClass)) {
        return false;
      } else {
        removeClass(currentHsDom, activeClass);
      }

      // 当选中一个元素后，开始移除背景色
      if (selectedList.length === 1) {
        let firstIndex = overList[0].index;
        if (index >= firstIndex) {
          for (let i = 0; i <= index; i++) {
            removeClass(
              document.querySelector(".hs-select__item" + i),
              inRange
            );
          }
        } else {
          while (index <= firstIndex) {
            removeClass(
              document.querySelector(".hs-select__item" + index),
              inRange
            );
            index++;
          }
        }
      }
    };

    // 鼠标点击
    const selectValue = (index, item) => {
      if (props.disabled) return;
      let len = selectedList.length;

      if (len < 2) {
        selectedList.push({ item, index });
        addClass(document.querySelector("." + voidClass + index), stayClass);

        addClass(
          document.querySelector(".hs-select__item" + selectedList[0].index),
          bothLeftSides
        );

        if (selectedList[1]) {
          if (selectedDirection === "right") {
            addClass(
              document.querySelector(
                ".hs-select__item" + selectedList[1].index
              ),
              bothRightSides
            );
          } else {
            addClass(
              document.querySelector(
                ".hs-select__item" + selectedList[1].index
              ),
              bothLeftSides
            );
          }
        }

        if (len === 1) {
          // 顺时针排序
          if (selectedDirection === "right") {
            emit("selectedVal", {
              left: selectedList[0].item,
              right: selectedList[1].item,
              whole: selectedList,
            });
          } else {
            emit("selectedVal", {
              left: selectedList[1].item,
              right: selectedList[0].item,
              whole: selectedList,
            });
          }
        }
      } else {
        nextTick(() => {
          selectedList.forEach((v) => {
            removeClass(
              document.querySelector("." + voidClass + v.index),
              activeClass,
              stayClass
            );

            removeClass(
              document.querySelector(".hs-select__item" + v.index),
              bothLeftSides,
              bothRightSides
            );
          });

          selectedList = [];
          overList = [];
          for (let i = 0; i <= props.max; i++) {
            let currentDom = document.querySelector(".hs-select__item" + i);
            if (currentDom) {
              removeClass(currentDom, inRange);
            }
          }

          selectedList.push({ item, index });
          addClass(document.querySelector("." + voidClass + index), stayClass);

          addClass(
            document.querySelector(".hs-select__item" + selectedList[0].index),
            bothLeftSides
          );
        });
      }
    };

    // 回显数据
    const echoView = (item) => {
      if (item.length === 0) return;
      if (item.length > 2 || item.length === 1) {
        throw "传入的数组长度必须是2";
      }

      item.sort((a, b) => {
        return a - b;
      });

      addClass(
        vm.refs["hsdiv" + props.HsKey + item[0]],
        activeClass,
        stayClass
      );

      addClass(vm.refs["hstd" + props.HsKey + item[0]], bothLeftSides);

      addClass(
        vm.refs["hsdiv" + props.HsKey + item[1]],
        activeClass,
        stayClass
      );

      addClass(vm.refs["hstd" + props.HsKey + item[1]], bothRightSides);

      while (item[1] >= item[0]) {
        addClass(vm.refs["hstd" + props.HsKey + item[0]], inRange);
        item[0]++;
      }
    };

    onBeforeMount(() => {
      vm = getCurrentInstance();
      nextTick(() => {
        echoView(props.echo);
      });
    });

    return {
      rateDisabled,
      setCurrentValue,
      resetCurrentValue,
      selectValue,
      classes,
      echoView,
    };
  },
});
</script>

<style scoped>
.hs-rate__icon {
  font-size: 18px;
  transition: 0.3s;
}
.hs-item {
  width: 30px;
  height: 30px;
  box-sizing: border-box;
  line-height: 30px;
}
.hs-on {
  background-color: #409eff;
  border-radius: 50%;
}
.hs-range {
  background-color: #ccc;
}
.both-left-sides {
  border-radius: 50% 0 0 50%;
}
.both-right-sides {
  border-radius: 0 50% 50% 0;
}
</style>
*/