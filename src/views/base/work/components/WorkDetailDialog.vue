<template>
  <el-dialog v-model="visible" title="小工艺管理" width="720px" :close-on-click-modal="false">
    <el-table :data="records" border max-height="420">
      <el-table-column prop="workName" label="工艺大类" width="140" />
      <el-table-column prop="detailName" label="小工艺" width="180" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column label="操作" width="120"><template #default="{row}"><el-button link type="primary" @click="edit(row)">编辑</el-button><el-button link type="danger" @click="remove(row.id)">删除</el-button></template></el-table-column>
    </el-table>
    <el-button type="primary" plain class="add" @click="edit()">新增小工艺</el-button>
    <el-dialog v-model="editing" title="小工艺" width="620px" append-to-body>
      <el-form :model="form" label-width="90px">
        <el-form-item label="工艺大类"><el-select v-model="form.workId" style="width:100%"><el-option v-for="item in works" :key="item.id" :label="item.workName" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="小工艺"><el-input v-model="form.detailName" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="editing=false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template>
    </el-dialog>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteWorkDetail, getAllWork, getWorkDetails, saveWorkDetail } from "@/api/modules/work";
const visible=ref(false),editing=ref(false),records=ref<any[]>([]),works=ref<any[]>([]),form=ref<any>({});
const load=async()=>{const result:any=await getWorkDetails();records.value=result.data||[]};
const open=async()=>{const result:any=await getAllWork({pageNum:1,pageSize:9999});works.value=result.data?.records||[];await load();visible.value=true};
const edit=(row:any={})=>{form.value={id:row.id,workId:row.workId,detailName:row.detailName||"",remark:row.remark||""};editing.value=true};
const submit=async()=>{if(!form.value.workId||!form.value.detailName){ElMessage.warning("请填写工艺大类和小工艺名称");return}await saveWorkDetail(form.value);ElMessage.success("保存成功");editing.value=false;await load()};
const remove=async(id:number)=>{await ElMessageBox.confirm("确认删除该小工艺？","提示",{type:"warning"});await deleteWorkDetail(id);await load()};
defineExpose({open});
</script>
<style scoped>.add{margin-top:12px}</style>
