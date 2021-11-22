import { onMounted, ref } from "vue";
  
  export default {
    setup() {
      let starsRef = ref(null);
  
      const starsCount = 800; //星星数量
      const distance = 900; //间距
  
      onMounted(() => {
        let starNodes = Array.from(starsRef.value.children);
        starNodes.forEach((item) => {
          let speed = 0.2 + Math.random() * 1;
          let thisDistance = distance + Math.random() * 300;
          item.style.transformOrigin = `0 0 ${thisDistance}px`;
          item.style.transform = `
          translate3d(0,0,-${thisDistance}px)
          rotateY(${Math.random() * 360}deg)
          rotateX(${Math.random() * -50}deg)
          scale(${speed},${speed})`;
        });
      });
  
      return {
        starsRef,
        starsCount,
      };
    },
  };