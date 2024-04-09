import {groups, sum, min, max} from "d3";

export function adjustSankeySize(
  inputGraph,
  useManualScale,
  nodePadding,
  nodeWidth,
  scaleDomain,
  scaleRange,
  circularLinkPortionTopBottom,
  circularLinkPortionLeftRight,
  scale,
  baseRadius
) {
  let graph = inputGraph;

  let columns = 
    groups(graph.nodes, (d) => d.column)
    .sort((a, b) => a[0] - b[0])
    .map((d) => d[1]);

  if (true) {
    graph.py = nodePadding;

    var ky = min(columns, function (nodes) {
      return (
        (graph.y1 - graph.y0 - (nodes.length - 1) * graph.py) /
        sum(nodes, function (d) {
          return d.virtual ? 0 : d.value;
        })
      );
    });

    let maxColumnSum = max(columns, function (nodes) {
      let sumNodesValue =
        sum(nodes, function (d) {
          return d.virtual ? 0 : d.value;
        }) +
        (nodes.length - 1) * graph.py;
      return sumNodesValue;
    });

    let ky1 = (graph.y1 - graph.y0) / maxColumnSum;

    //calculate the widths of the links
    graph.ky = ky * scale;

    graph.links.forEach(function (link) {
      link.width = link.value * graph.ky;
    });

    //determine how much to scale down the chart, based on circular links

    var totalTopLinksWidth = 0,
      totalBottomLinksWidth = 0,
      totalRightLinksWidth = 0,
      totalLeftLinksWidth = 0;

    var maxColumn = max(graph.nodes, function (node) {
      return node.column;
    });

    graph.links.forEach(function (link) {
      if (link.circular) {
        if (link.circularLinkType == "top") {
          totalTopLinksWidth = totalTopLinksWidth + link.width;
        } else {
          totalBottomLinksWidth = totalBottomLinksWidth + link.width;
        }

        if (link.target.column == 0) {
          totalLeftLinksWidth = totalLeftLinksWidth + link.width;
        }

        if (link.source.column == maxColumn) {
          totalRightLinksWidth = totalRightLinksWidth + link.width;
        }
      }
    });

    //account for radius of curves and padding between links
    totalTopLinksWidth =
      totalTopLinksWidth > 0
        ? totalTopLinksWidth + baseRadius
        : totalTopLinksWidth;
    totalBottomLinksWidth =
      totalBottomLinksWidth > 0
        ? totalBottomLinksWidth + baseRadius
        : totalBottomLinksWidth;
    totalRightLinksWidth =
      totalRightLinksWidth > 0
        ? totalRightLinksWidth + baseRadius
        : totalRightLinksWidth;
    totalLeftLinksWidth =
      totalLeftLinksWidth > 0
        ? totalLeftLinksWidth + baseRadius
        : totalLeftLinksWidth;

    var margin = {
      top: totalTopLinksWidth,
      bottom: totalBottomLinksWidth,
      left: totalLeftLinksWidth,
      right: totalRightLinksWidth,
    };

    graph.nodes.forEach(function (node) {
      node.x0 =
        graph.x0 +
        node.column * ((graph.x1 - graph.x0 - nodeWidth) / maxColumn);
      node.x1 = node.x0 + nodeWidth;
    });
  }

  return graph;
}
