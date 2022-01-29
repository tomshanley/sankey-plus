import * as _ from "lodash";
import { SankeyChart } from "../../src/sankeyPlus";

// Data
import { data } from "./data/set-1";
import { config } from "./config/config";

// Container size
const containerSize = (container) => {
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  return { width, height };
};

const containerId = "chart";
const container = document.getElementById(containerId);
const { width, height } = containerSize(container);

// add data, height and width to external configuration file
config.width = width;
config.height = height;
config.nodes.data = data.nodes;
config.links.data = data.links;

/**
 * Create Sankey Chart
 * Call `draw` to use built-in drawing engine
 */

const sankey = new SankeyChart(config);
sankey.process();
sankey.draw(containerId);

/* If you want to use your own drawing engine, you can use { graph } */
console.info(sankey.graph);

/**
 * Resize Sankey when container resizes
 */
const debounce = _.debounce(() => {
  const { width, height } = containerSize(container);
  sankey.config.width = width;
  sankey.config.height = height;
  sankey.process();
  sankey.draw(containerId);
}, 100);

const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    if (entry.target.id === containerId) {
      debounce();
    }
  }
});

resizeObserver.observe(container);
