export interface EchartsOption {
  tooltip: Tooltip;
  toolbox: Toolbox;
  legend: Legend;
  xAxis: XAxis[];
  yAxis: YAxis[];
  series: Series[];
}

export interface Tooltip {
  trigger: string;
  axisPointer: AxisPointer;
}

export interface AxisPointer {
  type: string;
  crossStyle?: CrossStyle;
}

export interface CrossStyle {
  color: string;
}

export interface Toolbox {
  feature: Feature;
}

export interface Feature {
  dataView: DataView;
  magicType: MagicType;
  restore: Restore;
  saveAsImage: SaveAsImage;
}

export interface DataView {
  show: boolean;
  readOnly: boolean;
}

export interface MagicType {
  show: boolean;
  type: string[];
}

export interface Restore {
  show: boolean;
}

export interface SaveAsImage {
  show: boolean;
}

export interface Legend {
  data: string[];
}

export interface XAxis {
  type: string;
  data: string[];
  axisPointer: AxisPointer;
}

export interface YAxis {
  type: string;
  name: string;
  min: number;
  max: number;
  interval: number;
  axisLabel: AxisLabel;
}

export interface AxisLabel {
  formatter: string;
}

export interface Series {
  name: string;
  type: string;
  data: number[];
  yAxisIndex?: number;
}
