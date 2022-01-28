import * as d3 from "d3";
import * as _ from "lodash";
import { SankeyChart } from "../../src/sankeyPlus";

// Data
import { data } from "./data/set-1";

// Container size
const containerSize = (container) => {
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  return { width, height };
};

const container = document.getElementById("chart");
const { width, height } = containerSize(container);

// Configuration
const config = {
  align: "left",
  id: (d) => d.name,
  iterations: 10,
  extent: [
    [0, 0],
    [1, 1],
  ],
  padding: 5,
  width,
  height,
  useManualScale: false,
  // showCanvasBorder: true,
  nodes: {
    data: data.nodes,
    width: 10,
    scaleDomain: [0, 100],
    scaleRange: [0, 75],
    padding: 25,
    minPadding: 25,
    virtualPadding: 7,
    sort: null,
    setPositions: false,
  },
  links: {
    data: data.links,
    circularGap: 5,
    circularLinkPortionTopBottom: 0.4,
    circularLinkPortionLeftRight: 0.1,
    useVirtualRoutes: true,
    baseRadius: 10,
    verticalMargin: 25,
    opacity: 0.5,
    virtualLinkType: "both", // ["both", "bezier", "virtual"]
  },
  arrows: {
    enabled: true,
    color: "DarkSlateGrey",
    length: 10,
    gap: 25,
    headSize: 4,
  },
};

/**
 * Create Sankey Chart
 * Call `redraw` to use built-in drawing engine
 */
const d3Container = d3.select("#chart");
const sankey = new SankeyChart(d3Container, config);
sankey.calculate();
sankey.redraw();

/**
 * If you want to use your own drawing engine, you can use { graph }
 */
console.info(sankey.graph);

/**
 * Resize Sankey when container resizes
 */
const debounce = _.debounce(() => {
  const { width, height } = containerSize(container);
  sankey.config.width = width;
  sankey.config.height = height;
  sankey.calculate();
  sankey.redraw();
}, 100);

const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    if (entry.target.id === "chart") {
      debounce();
    }
  }
});

resizeObserver.observe(container);
