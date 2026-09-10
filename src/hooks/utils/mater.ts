import { Custs } from "@/api/interface/outgoing";
export function optionMap(data: Custs) {
  const children = Array.isArray(data.children) ? data.children.map(optionMap) : undefined;
  const disabled = isNaN(Number(data.id)) && !Array.isArray(data.children) ? true : false;
  return {
    // label: data.name,
    // value: data.id,
    name: data.name,
    id: Number(data.id),
    children: children,
    disabled: disabled
  };
}
