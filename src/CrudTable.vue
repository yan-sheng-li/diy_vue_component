<!-- src/components/CrudTable.vue -->
<template>
  <div class="crud-container">
    <!-- 搜索区域 -->
    <el-card v-if="config.searchFields?.length" class="search-form" shadow="never">
      <el-form :model="searchForm" ref="searchFormRef" :inline="true">
        <el-form-item v-for="field in config.searchFields" :key="field.prop" :label="field.label" :prop="field.prop">

          <!-- 下拉选择框 -->
          <el-select v-if="field.type === 'select'" v-model="searchForm[field.prop]" v-bind="field.props || {}"
            clearable filterable style="width: 100%">
            <el-option v-for="opt in getOptions(field)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <!-- 单选框 -->
          <el-radio-group v-else-if="field.type === 'radio'" v-model="searchForm[field.prop]"
            v-bind="field.props || {}">
            <el-radio v-for="opt in getOptions(field)" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>

          <el-input v-else-if="field.type === 'input'" v-model="searchForm[field.prop]" v-bind="field.props || {}" />

          <!-- 多选框 -->
          <el-checkbox-group v-else-if="field.type === 'checkbox'" v-model="searchForm[field.prop]"
            v-bind="field.props || {}">
            <el-checkbox v-for="opt in getOptions(field)" :key="opt.value" :value="opt.value">{{ opt.label
            }}</el-checkbox>
          </el-checkbox-group>

          <!-- 日期/其他类型 -->
          <component v-else :is="getComponent(field.type)" v-model="searchForm[field.prop]" v-bind="field.props || {}"
            v-on="field.events || {}" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ config.searchButtonText || '查询' }}</el-button>
          <el-button @click="handleReset">{{ config.resetButtonText || '重置' }}</el-button>
        </el-form-item>

        <el-form-item v-if="config.extraSearchButtons?.length">
          <el-button v-for="btn in config.extraSearchButtons" :key="btn.label" :type="btn.type || 'default'"
            @click="handleExtraSearchButton(btn)">
            {{ btn.label }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-container" shadow="never">
      <template #header>
        <div class="operation-buttons">
          <span>{{ config.tableTitle || '数据列表' }}</span>
          <div>
            <el-tooltip v-for="btn in config.operations" :key="btn.name" :content="btn.label" placement="top">
              <el-button circle :type="btn.type || 'primary'" @click="handleOperation(btn)">
                <Icon :icon="btn.icon" width="24" height="24" />
              </el-button>
            </el-tooltip>
          </div>


        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange" :height="config.tableHeight ?? 380"
        :border="config.border ?? true" :stripe="config.stripe ?? true" :row-key="config.rowKey || 'id'">
        <el-table-column v-if="config.selection" type="selection" width="55" />
        <el-table-column v-for="col in config.columns" :key="col.prop || col.label" v-bind="col">
          <template #default="scope" v-if="col.slot">
            <slot :name="col.slot" :row="scope.row" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination v-if="config.pagination !== false" class="pagination-container"
        v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
        :page-sizes="pagination.pageSizes || [10, 20, 50, 100]" :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-if="config.formFields?.length" :title="dialogTitle" v-model="dialogVisible"
      :width="config.dialogWidth || '50%'" @close="handleDialogClose">
      <el-form :model="form" ref="formRef" :rules="formRules" :label-width="config.labelWidth || '100px'">
        <el-form-item v-for="field in config.formFields" :key="field.prop" :label="field.label" :prop="field.prop"
          v-show="!isEdit || (isEdit && !field.addOnly)">

          <!-- 单选 -->
          <el-radio-group v-if="field.type === 'radio'" v-model="form[field.prop]"
            v-bind="{ ...(field.props || {}), disabled: isEdit && field.editable === false }">
            <el-radio v-for="opt in (field.options || field.props?.options || [])" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>

          <!-- 多选 -->
          <el-checkbox-group v-else-if="field.type === 'checkbox'" v-model="form[field.prop]"
            v-bind="{ ...(field.props || {}), disabled: isEdit && field.editable === false }">
            <el-checkbox v-for="opt in (field.options || field.props?.options || [])" :key="opt.value"
              :value="opt.value">
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>

          <!-- 下拉选择 -->
          <el-select v-else-if="field.type === 'select'" v-model="form[field.prop]" :multiple="field.multiple" v-bind="{
            ...(field.props || {}),
            filterable: true,
            clearable: true,
            disabled: isEdit && field.editable === false
          }" placeholder="请选择">

            <el-option v-for="opt in getOptions(field)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <!-- tags 标签输入 -->
          <el-input-tag v-else-if="field.type === 'tags'" v-model="form[field.prop]"
            v-bind="{ ...(field.props || {}), disabled: isEdit && field.editable === false }" placeholder="请输入标签后按回车" />

          <!-- 处理 Markdown -->
          <MdEditor v-else-if="field.type === 'markdown'" v-model="form[field.prop]"
            :toolbars="['bold', 'italic', 'link', 'code']" />

          <!-- 上传组件（支持单图/多图） -->
          <el-upload v-else-if="field.type === 'upload'" v-model:file-list="form[field.prop]"
            :action="field.props?.action || 'https://mini.liyansheng.top/v1/api/image/upload'"
            :list-type="field.props?.listType || 'picture-card'" :limit="field.props?.limit || 1"
            :multiple="(field.props?.limit || 1) > 1" :disabled="isEdit && field.editable === false"
            :on-preview="handlePreview" :before-remove="handleBeforeRemove" :on-exceed="handleExceed"
            :on-change="(file, fileList) => handleUploadChange(field, file, fileList)" v-bind="field.props || {}"
            v-on="field.events || {}">
            <Icon icon="la:cloud-upload-alt" width="96" height="96" />
          </el-upload>

          <!-- 其他类型组件 -->
          <component v-else :is="getComponent(field.type)" v-model="form[field.prop]"
            v-bind="{ ...(field.props || {}), disabled: isEdit && field.editable === false }"
            v-on="field.events || {}" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { MdEditor } from 'md-editor-v3';
import MapPicker from './MapPicker.vue';

// 动态生成表单规则
const generateFormRules = () => {
  const rules = {};
  props.config.formFields?.forEach(field => {
    const isVisible = !isEdit.value || (isEdit.value && !field.addOnly);
    const isEditable = !isEdit.value || (isEdit.value && field.editable !== false);

    if (field.required && isVisible && isEditable) {
      rules[field.prop] = [
        { required: true, message: `${field.label}不能为空`, trigger: 'blur' }
      ];
    }
  });
  return rules;
};

const formRules = computed(() => generateFormRules());


const props = defineProps({
  config: { type: Object, required: true },
  api: { type: Object, required: true }
});

const emit = defineEmits(['operation', 'search', 'reset', 'selection-change']);

// 状态
const searchForm = reactive({});
const tableData = ref([]);
const loading = ref(false);
const multipleSelection = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const isEdit = ref(false);
const currentId = ref('');
const form = reactive({});
const formRef = ref();
const searchFormRef = ref();
const pagination = reactive({
  currentPage: 1,
  pageSize: props.config.pageSize || 10,
  pageSizes: props.config.pageSizes || [10, 20, 50, 100],
  total: 0
});

// 获取选项
const getOptions = (field) => field.options || field.props?.options || [];

// 组件类型映射
const getComponent = (type, props = {}) => {
  if (type === 'input') {
    // input 下根据 props.type 决定样式
    return 'el-input'; // el-input 本身支持 type="text" | "password" | "textarea"
  }
  return {
    select: 'el-select',
    radio: 'el-radio-group',
    checkbox: 'el-checkbox-group',
    switch: 'el-switch',
    inputNumber: 'el-input-number',
    cascader: 'el-cascader',
    slider: 'el-slider',
    time: 'el-time-picker',
    rate: 'el-rate',
    color: 'el-color-picker',
    upload: 'el-upload',
    markdown: MdEditor,
    date: 'el-date-picker',
    map: MapPicker
  }[type] || 'el-input';
};


// 初始化表单数据
const initFormData = () => {
  props.config.formFields?.forEach(field => {
    // 如果编辑模式 && addOnly 为 true，则跳过该字段
    if (isEdit.value && field.addOnly) return;

    let value = field.defaultValue !== undefined ? field.defaultValue : '';

    // tags 字段处理：保持为数组
    if (field.prop === 'tags') {
      if (Array.isArray(value)) {
        // 已经是数组，直接使用
      } else if (typeof value === 'string') {
        // 字符串：按逗号分割（若没有逗号，得到单元素数组）
        value = value.split(',').map(v => v.trim()).filter(Boolean);
      } else {
        value = [];
      }
    }

    if (field.type === 'select') {
      if (field.multiple) {
        // 多选必须是数组
        if (!Array.isArray(value)) {
          value = value ? [value] : [];
        }
      } else {
        // 单选必须是单值
        if (Array.isArray(value)) {
          value = value[0] ?? '';
        }
      }
    }


    // inputNumber 字段处理
    if (field.type === 'inputNumber') {
      value = value !== '' ? Number(value) : null;
    }

    // upload 类型存 fileList 数组
    if (field.type === 'upload') {
      value = []; // 初始化为空数组
    }

    if (field.type === 'map') {
      if (Array.isArray(value) && value.length === 2) {
        value = { lnglat: value, address: '' };
      } else if (!value || typeof value !== 'object') {
        value = { lnglat: null, address: '' };
      }
    }

    form[field.prop] = value;
  });
};


const handleExtraSearchButton = (btn) => { if (btn.handler) btn.handler(); }

const updateTableData = (data = [], total = 0) => { tableData.value = data; pagination.total = total; pagination.currentPage = 1; loading.value = false; }




// 初始化搜索表单
const initSearchFormData = () => {
  props.config.searchFields?.forEach(f => {
    const opts = getOptions(f);
    searchForm[f.prop] = opts.some(opt => opt.value === f.defaultValue) ? f.defaultValue : (opts[0]?.value || '');
  });
};

// 获取数据
const fetchData = async () => {
  try {
    loading.value = true;
    const params = { ...searchForm, page: pagination.currentPage, pageSize: pagination.pageSize };
    const res = await props.api.list(params);
    tableData.value = res.data || res.records || res.list || [];
    pagination.total = res.total || res.count || 0;
    emit('search', { searchForm, pagination });
  } catch (err) {
    console.error(err);
    ElMessage.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 搜索/重置
const handleSearch = () => { pagination.currentPage = 1; fetchData(); };
const handleReset = () => { searchFormRef.value?.resetFields(); emit('reset'); handleSearch(); };

// 表格选择
const handleSelectionChange = (val) => { multipleSelection.value = val; emit('selection-change', val); };

// 分页
const handleSizeChange = (val) => { pagination.pageSize = val; fetchData(); };
const handleCurrentChange = (val) => { pagination.currentPage = val; fetchData(); };

// 操作按钮
const handleOperation = (btn) => {
  if (btn.handler) {
    btn.handler({ searchForm, multipleSelection, openDialog, fetchData });
  } else {
    emit('operation', { name: btn.name, searchForm, multipleSelection, openDialog, fetchData });
    if (btn.name === 'add') handleAdd();
    if (btn.name === 'batchDelete') handleBatchDelete();
  }
};

// 新增/编辑
const handleAdd = () => openDialog(props.config.addTitle || '新增', false);
// 编辑
const handleEdit = (row) => {
  dialogTitle.value = props.config.editTitle || '编辑';
  isEdit.value = true;
  currentId.value = row[props.config.rowKey || 'id'];

  // 填充表单数据
  props.config.formFields.forEach(field => {
    let value = row[field.prop] !== undefined && row[field.prop] !== null ? row[field.prop] : field.defaultValue || '';

    // 如果是 tags 字段且是数组，转成逗号分隔的字符串
    if (field.prop === 'tags') {
      if (Array.isArray(value)) {
        // ok
      } else if (typeof value === 'string') {
        value = value.split(',').map(v => v.trim()).filter(Boolean);
      } else {
        value = [];
      }
    }
    // inputNumber 字段处理
    if (field.type === 'inputNumber') {
      value = value !== '' ? Number(value) : null;
    }

    if (field.type === 'select') {
      if (field.multiple) {
        if (!Array.isArray(value)) value = value ? [value] : [];
      } else {
        if (Array.isArray(value)) value = value[0] ?? '';
      }
    }


    // upload 类型处理
    if (field.type === 'upload') {
      // 如果 value 是 URL 数组，转换成 el-upload 的 fileList 格式
      if (Array.isArray(value)) {
        value = value.map((url, index) => ({
          name: `图片${index + 1}`,
          url,
          status: 'finished', // 表示上传完成
        }));
      } else if (typeof value === 'string' && value) {
        value = [{
          name: '图片',
          url: value,
          status: 'finished',
        }];
      } else {
        value = [];
      }
    }

    if (field.type === 'map') {
      if (!value || !value.lnglat) {
        value = { lnglat: null, address: '' };
      }
    }



    form[field.prop] = value;
  });

  dialogVisible.value = true;
};

const handleBeforeRemove = (file) => {
  // 只允许 url 是字符串的文件被移除
  console.log(file);
  return typeof file.url === 'string';
};


// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(props.config.deleteConfirmText || '确定删除?', props.config.deleteConfirmTitle || '提示', { type: 'warning' });
    await props.api.delete(row[props.config.rowKey || 'id']);
    ElMessage.success(props.config.deleteSuccessText || '删除成功');
    fetchData();
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(props.config.deleteErrorText || '删除失败');
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (!multipleSelection.value.length) return ElMessage.warning(props.config.noSelectionText || '请选择记录');
  try {
    await ElMessageBox.confirm(props.config.batchDeleteConfirmText || `确定删除 ${multipleSelection.value.length} 条?`, props.config.deleteConfirmTitle || '提示', { type: 'warning' });
    const ids = multipleSelection.value.map(i => i[props.config.rowKey || 'id']);
    await props.api.batchDelete(ids);
    ElMessage.success(props.config.batchDeleteSuccessText || '删除成功');
    fetchData();
  } catch (err) { if (err !== 'cancel') ElMessage.error(props.config.batchDeleteErrorText || '删除失败'); }
};

// 打开对话框
const openDialog = (title, editMode = false, rowData = null) => {
  dialogTitle.value = title;
  isEdit.value = editMode;

  if (rowData) {
    currentId.value = rowData[props.config.rowKey || 'id'];

    props.config.formFields?.forEach(field => {
      // 编辑时跳过只在新增显示的字段
      if (editMode && field.addOnly) return;

      let value = rowData[field.prop] !== undefined && rowData[field.prop] !== null
        ? rowData[field.prop]
        : field.defaultValue ?? '';

      // tags 保持数组类型
      if (field.prop === 'tags') {
        if (Array.isArray(value)) {
          // ok
        } else if (typeof value === 'string') {
          value = value.split(',').map(v => v.trim()).filter(Boolean);
        } else {
          value = [];
        }
      }

      // inputNumber
      if (field.type === 'inputNumber') value = value !== '' ? Number(value) : null;

      form[field.prop] = value;
    });

  } else {
    currentId.value = '';
    initFormData();
  }

  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  try {
    if (formRef.value) await formRef.value.validate();

    loading.value = true;
    // 构建提交数据
    const submitData = {};

    props.config.formFields?.forEach(field => {
      if (isEdit.value && (field.addOnly || field.editable === false)) return;
      let value = form[field.prop];

      // 处理日期类型字段
      if (field.type === 'date') {
        if (value instanceof Date) {
          // 根据 props.type 判断是日期还是日期时间
          const dateType = field.props?.type || 'date';
          if (dateType === 'datetime' || dateType === 'datetime-picker') {
            value = new Date(value).toISOString().slice(0, 19).replace('T', ' ');
          } else {
            value = new Date(value).toISOString().slice(0, 10);
          }
        }
      }

      if (field.type === 'select') {
        if (field.multiple) {
          submitData[field.prop] = Array.isArray(value) ? value : (value ? [value] : []);
        } else {
          submitData[field.prop] = Array.isArray(value) ? value[0] : value;
        }
        return;
      }


      if (field.type === 'map') {
        const val = form[field.prop];
        submitData[field.prop] = val ? { lnglat: val.lnglat, address: val.address } : null;
      } else if (field.type === 'upload') {
        // 修复：从 fileList 提取 URLs，并根据 limit 决定字符串/数组
        const fileList = form[field.prop] || [];
        // 提取 URL（支持已上传的 response 或 url）
        const urls = fileList
          .map(file => {
            const res = file.response;
            console.log('上传文件响应：', res);

            // ① 后端直接返回字符串
            if (typeof res === 'string') {
              return res;
            }

            // ② imageUrl 为数组
            if (Array.isArray(res?.imageUrl)) {
              return res.imageUrl[0];
            }

            // ③ imageUrl 为字符串
            if (typeof res?.imageUrl === 'string') {
              return res.imageUrl;
            }

            // ④ 其他可能的字段（如 url）
            if (typeof res?.url === 'string') {
              return res.url;
            }

            // ⑤ 最后兜底
            return file.url || '';
          })
          .filter(Boolean);
        // limit===1 → 单图，取字符串，否则数组
        const limit = field.props?.limit || 1;
        submitData[field.prop] = limit === 1 ? (urls[0] || '') : urls;
      } else {
        submitData[field.prop] = value;
      }
    });
    console.log(submitData);  // 调试：检查输出

    if (isEdit.value) {
      submitData[props.config.rowKey || 'id'] = currentId.value;
      await props.api.update(submitData);
      ElMessage.success(props.config.updateSuccessText || '更新成功');
    } else {
      await props.api.create(submitData);
      ElMessage.success(props.config.createSuccessText || '新增成功');
    }
    dialogVisible.value = false;
    fetchData();

  } catch (err) {
    console.error(err);
    ElMessage.error(props.config.submitErrorText || '提交失败');
  } finally {
    loading.value = false;
  }
};


// 上传变更时即时裁剪 fileList
const handleUploadChange = (field, file, fileList) => {
  const limit = (field.props && field.props.limit) ? Number(field.props.limit) : 1;

  if (limit === 1 && fileList.length > 1) {
    // 只保留最后上传的文件
    form[field.prop] = [fileList[fileList.length - 1]];
  } else {
    form[field.prop] = fileList.slice();
  }
};


// 图片预览
const handlePreview = (file) => {
  if (file.url) {
    window.open(file.url, '_blank');
  } else if (file.response?.imageUrl) {
    const img = Array.isArray(file.response.imageUrl)
      ? file.response.imageUrl[0]
      : file.response.imageUrl;
    if (img) window.open(img, '_blank');
  }
};

// 上传超出限制提示
const handleExceed = (files, fileList) => {
  ElMessage.warning(`最多只能上传 ${fileList.length} 张图片`);
};


// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields();
  Object.keys(form).forEach(k => delete form[k]);
  initFormData();
};

// 暴露方法给父组件
defineExpose({ fetchData, openDialog, handleEdit, handleDelete, updateTableData, getSelectedRows: () => multipleSelection.value });

// 初始化
onMounted(() => { initSearchFormData(); fetchData(); });
</script>

<style scoped>
.crud-container {
  padding: 20px;
  background: #f5f7fa;
}

.search-form,
.table-container {
  background: #fff;
  margin-bottom: 20px;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.operation-buttons {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
