<template>
  <div class="map-picker">
    <!-- 地址输入框 -->
  <el-input ref="addressInput" v-model="address" placeholder="请输入地址或点击地图选择" @focus="openMapDialog" clearable>
      <template #suffix>
        <el-icon>
          <Icon icon="entypo:location" width="24" height="24" />
        </el-icon>
      </template>
    </el-input>

    <!-- 地图弹窗 -->
    <el-dialog v-model="dialogVisible" title="选择位置" width="80%" :destroy-on-close="false">
      <div class="map-tools">
        <el-input v-model="searchKeyword" placeholder="搜索地点，例如：天安门" clearable @keyup.enter="handleSearch"
          class="search-box">
          <template #append>
            <el-button @click="handleSearch" type="primary">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div id="map-container" class="map-container"></div>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="confirmLocation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
// ---- 双向绑定 ----
const modelValue = defineModel() // 支持两种格式：[lng,lat]（向后兼容）或 { lnglat: [lng,lat], address: 'xxx' }
const address = ref('')
const dialogVisible = ref(false)
const searchKeyword = ref('')
const addressInput = ref(null)

let map, marker, geocoder, placeSearch

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
const openMapDialog = () => {
  dialogVisible.value = true
  setTimeout(initMap, 300)
}

// 初始化地图
const initMap = () => {
  if (!window.AMap) {
    ElMessage.error('请先引入高德地图 JS SDK')
    return
  }

  // 地图实例
  const initialCenter = extractLngLat(modelValue.value) || [116.397428, 39.90923]
  map = new AMap.Map('map-container', {
    zoom: 12,
    center: initialCenter
  })

  // 地理编码服务
  AMap.plugin(['AMap.Geocoder', 'AMap.PlaceSearch'], () => {
    geocoder = new AMap.Geocoder()
    placeSearch = new AMap.PlaceSearch({ map })
  })

  // 标记点（先不设置位置）
  marker = new AMap.Marker({ map })

  // 如果已有坐标，放置标记并回显地址（支持 array 或 object）
  const existing = extractLngLat(modelValue.value)
  if (existing) {
    marker.setPosition(existing)
    // 如果 modelValue 带 address，直接使用；否则执行逆编码
    const addrFromModel = modelValue.value && modelValue.value.address
    if (addrFromModel) {
      address.value = addrFromModel
      // 在标记上显示地址标签
      try { marker.setLabel({ content: address.value, offset: new AMap.Pixel(0, -30) }) } catch (e) { /* ignore */ }
    } else {
      reverseGeocode(existing)
    }
  }

  // 点击地图事件
  map.on('click', (e) => {
    const lnglat = [e.lnglat.getLng(), e.lnglat.getLat()]
    marker.setPosition(lnglat)
    // 先更新 modelValue（会被 reverseGeocode 覆盖 address 字段）
    setModelValue(lnglat, '')
    reverseGeocode(lnglat)
  })
}

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
