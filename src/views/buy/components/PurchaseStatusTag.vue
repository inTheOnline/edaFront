<template><el-tag :type="tagType" effect="light" round>{{ status || "待处理" }}</el-tag></template>
<script setup lang="ts">
import{computed}from"vue";
const props=defineProps<{status?:string}>();
type TagType="success"|"warning"|"info"|"primary"|"danger";
const tagType=computed<TagType>(()=>({"待处理":"info","部分采购":"warning","已采购":"primary","部分回执":"warning","已完成":"success"}as Record<string,TagType>)[props.status||"待处理"]||"info");
</script>
