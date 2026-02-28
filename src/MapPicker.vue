<template>
  <div class="map-picker">
    <!-- 地址输入框 -->
    <el-input ref="addressInput" v-model="address" placeholder="请输入地址或点击地图选择" @focus="openMapDialog" clearable>
      <template #suffix>
        <el-icon><Location /></el-icon>
      </template>
    </el-input>

    <!-- 地图弹窗 -->
    <el-dialog v-model="dialogVisible" title="选择位置" width="80%" destroy-on-close @opened="handleDialogOpened">
      <div class="map-tools">
        <el-input v-model="searchKeyword" placeholder="搜索地点，例如：天安门" clearable @keyup.enter="handleSearch"
          class="search-box">
          <template #append>
            <el-button @click="handleSearch" type="primary">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div ref="mapContainerRef" id="map-container" class="map-container" style="height: 400px;"></div>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="confirmLocation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'

// ---- props ----
const props = defineProps({
  amapKey: {
    type: String,
    default: '' // 允许外部传入高德地图 Key
  }
})

// ---- 双向绑定 ----
const modelValue = defineModel() // 支持两种格式：[lng,lat]（向后兼容）或 { lnglat: [lng,lat], address: 'xxx' }
const address = ref('')
const dialogVisible = ref(false)
const searchKeyword = ref('')
const addressInput = ref(null)
const mapContainerRef = ref(null)

let map = null, marker = null, geocoder = null, placeSearch = null
let isScriptLoading = false
let isScriptLoaded = false

// 动态加载高德地图 SDK
const loadAMap = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve()
      return
    }
    if (isScriptLoading) {
      // 如果脚本正在加载，等待完成
      const checkLoaded = setInterval(() => {
        if (isScriptLoaded) {
          clearInterval(checkLoaded)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(checkLoaded)
        if (!window.AMap) reject(new Error('高德地图加载超时'))
      }, 10000)
      return
    }
    
    const key = props.amapKey || 'YOUR_AMAP_KEY'
    if (key === 'YOUR_AMAP_KEY') {
      reject(new Error('请配置高德地图 Key，通过 amap-key 属性传入'))
      return
    }
    
    isScriptLoading = true
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
    script.onload = () => {
      isScriptLoaded = true
      resolve()
    }
    script.onerror = () => {
      isScriptLoading = false
      reject(new Error('高德地图加载失败'))
    }
    document.head.appendChild(script)
  })
}

// 辅助：从 modelValue 中提取坐标（兼容 array 或 object）
const extractLngLat = (mv) => {
  if (!mv) return null
  if (Array.isArray(mv) && mv.length === 2) return mv
  if (mv && Array.isArray(mv.lnglat) && mv.lnglat.length === 2) return mv.lnglat
  return null
}

// 辅助：设置 modelValue (输出采用 object 格式以包含 address)
const setModelValue = (lnglat, addr) => {
  if (!lnglat || lnglat.length !== 2) return
  const payload = { lnglat: lnglat, address: addr ?? address.value ?? '' }
  try {
    // 如果 defineModel 支持直接赋值
    modelValue.value = payload
  } catch (e) {
    // 忽略赋值错误
  }
}

// 打开地图弹窗
const openMapDialog = async () => {
  // 确保地图 SDK 已加载
  if (!window.AMap) {
    try {
      await loadAMap()
    } catch (e) {
      ElMessage.error(e.message || '高德地图 SDK 加载失败，请检查网络或配置')
      return
    }
  }
  dialogVisible.value = true
  // 地图将在 handleDialogOpened 中初始化（dialog 完全打开后）
}

// Dialog 完全打开后的回调（动画完成）
const handleDialogOpened = async () => {
  await nextTick()
  await nextTick()
  // 再次确保容器有高度
  const container = mapContainerRef.value
  if (container && container.offsetHeight === 0) {
    // 如果高度还是 0，再等一会儿
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  initMap()
}

// 初始化地图
const initMap = () => {
  console.log('[MapPicker] initMap 被调用')
  
  if (!window.AMap) {
    console.error('[MapPicker] window.AMap 不存在')
    ElMessage.error('请先引入高德地图 JS SDK')
    return
  }

  // 检查容器是否存在且有尺寸
  const container = mapContainerRef.value
  if (!container) {
    console.error('[MapPicker] 地图容器未找到')
    return
  }
  
  console.log('[MapPicker] 容器尺寸:', container.offsetWidth, 'x', container.offsetHeight)

  // 如果地图已初始化过，销毁后重新创建
  if (map) {
    console.log('[MapPicker] 销毁旧地图实例')
    map.destroy()
    map = null
    marker = null
  }

  // 地图实例
  const initialCenter = extractLngLat(modelValue.value) || [116.397428, 39.90923]
  console.log('[MapPicker] 初始中心点:', initialCenter)
  
  try {
    map = new AMap.Map('map-container', {
      zoom: 12,
      center: initialCenter
    })
    console.log('[MapPicker] 地图实例创建成功')
  } catch (e) {
    console.error('[MapPicker] 创建地图失败:', e)
    ElMessage.error('地图初始化失败：' + e.message)
    return
  }

  // 地理编码服务
  AMap.plugin(['AMap.Geocoder', 'AMap.PlaceSearch'], () => {
    geocoder = new AMap.Geocoder()
    placeSearch = new AMap.PlaceSearch({ map })
    console.log('[MapPicker] 地理编码插件加载成功')
  })

  // 标记点
  marker = new AMap.Marker({ map })
  console.log('[MapPicker] 标记创建成功')

  // 如果已有坐标，放置标记并回显地址
  const existing = extractLngLat(modelValue.value)
  if (existing) {
    marker.setPosition(existing)
    const addrFromModel = modelValue.value && modelValue.value.address
    if (addrFromModel) {
      address.value = addrFromModel
      try { marker.setLabel({ content: address.value, offset: new AMap.Pixel(0, -30) }) } catch (e) { /* ignore */ }
    } else {
      reverseGeocode(existing)
    }
  }

  // 点击地图事件
  map.on('click', (e) => {
    const lnglat = [e.lnglat.getLng(), e.lnglat.getLat()]
    marker.setPosition(lnglat)
    setModelValue(lnglat, '')
    reverseGeocode(lnglat)
  })
}

watch(
  modelValue,
  (val) => {
    if (val && typeof val === 'object' && val.address) {
      address.value = val.address
    }
  },
  { immediate: true, deep: true }
)


// 搜索地址（地理编码）
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return ElMessage.warning('请输入搜索关键词')
  if (!placeSearch) return ElMessage.error('PlaceSearch 尚未初始化')

  placeSearch.search(searchKeyword.value, (status, result) => {
    if (status === 'complete' && result.poiList?.pois?.length) {
      const poi = result.poiList.pois[0]
      const lnglat = [poi.location.lng, poi.location.lat]
      map.setCenter(lnglat)
      marker.setPosition(lnglat)
      address.value = poi.name
      // 更新 modelValue 同时包含地址
      setModelValue(lnglat, address.value)
      // 在标记上显示地址标签
      try { marker.setLabel({ content: address.value, offset: new AMap.Pixel(0, -30) }) } catch (e) { /* ignore */ }
    } else {
      ElMessage.warning('未找到相关地点')
    }
  })
}

// 逆地理编码（坐标 → 地址）
const reverseGeocode = (lnglat) => {
  if (!geocoder) return
  geocoder.getAddress(lnglat, (status, result) => {
    if (status === 'complete' && result.regeocode) {
      address.value = result.regeocode.formattedAddress
      // 更新 modelValue，包含地址
      setModelValue(lnglat, address.value)
      // 在标记上显示地址标签
      try { marker.setLabel({ content: address.value, offset: new AMap.Pixel(0, -30) }) } catch (e) { /* ignore */ }
    }
  })
}

// 确认选择
const confirmLocation = () => {
  if (!modelValue.value) return ElMessage.warning('请在地图上选择位置')
  dialogVisible.value = false
  // 使当前聚焦元素失去焦点，避免 input 的 focus 事件立即重新打开弹窗
  try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) { /* ignore */ }
}

// 关闭对话框（用于取消按钮）
const closeDialog = () => {
  dialogVisible.value = false
  // 销毁地图实例，下次打开时重新创建
  if (map) {
    map.destroy()
    map = null
    marker = null
    geocoder = null
    placeSearch = null
  }
  try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) { /* ignore */ }
}

// 如果外部 v-model 更新，自动回显地址
watch(modelValue, (val) => {
  if (Array.isArray(val) && val.length === 2 && geocoder) {
    reverseGeocode(val)
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 400px;
  border-radius: 6px;
}

.map-tools {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.search-box {
  width: 400px;
}
</style>
