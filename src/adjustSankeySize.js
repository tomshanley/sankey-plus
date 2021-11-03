export function adjustSankeySize(inputGraph, useManualScale, nodePadding, nodeWidth, scaleDomain, scaleRange, circularLinkPortionTopBottom, circularLinkPortionLeftRight, scale) {
  //let graph = clone(inputGraph);
  let graph = inputGraph;

  let maxValue = d3.max(graph.nodes, d => d.value);

  console.log(maxValue)
  console.log(scaleDomain)
  console.log(scaleRange)

  let yScale = d3
    .scaleLinear()
    .domain(scaleDomain)
    .range(scaleRange);

  console.log(yScale(maxValue))

  let columns = d3.groups(graph.nodes, d => d.column)
    .sort((a, b) => a[0] - b[0])
    .map(d => d[1])

  if (useManualScale) {
    graph.py = nodePadding;

    //calculate the widths of the links
    graph.ky = yScale(maxValue) / maxValue;

    graph.links.forEach(function (link) {
      link.width = yScale(link.value);
    });

    //determine how much to scale down the chart, based on circular links

    var currentWidth = graph.x1 - graph.x0;
    var currentHeight = graph.y1 - graph.y0;

    let marginTopBottom = (currentHeight * circularLinkPortionTopBottom) / 2;
    let marginLeftRight = (currentWidth * circularLinkPortionLeftRight) / 2;

    graph.x0 = graph.x0 + marginLeftRight;
    graph.x1 = graph.x1 - marginLeftRight;
    graph.y0 = graph.y0 + marginTopBottom;
    graph.y1 = graph.y1 - marginTopBottom;

    var maxColumn = d3.max(graph.nodes, function (node) {
      return node.column;
    });

    graph.nodes.forEach(function (node) {
      node.x0 =
        graph.x0 +
        node.column * ((graph.x1 - graph.x0 - nodeWidth) / maxColumn);
      node.x1 = node.x0 + /*nodeWidthFunction(node)*/ nodeWidth;
    });
  }

  if (!useManualScale) {
    //override py if nodePadding has been set
    /*if (paddingRatio) {
      var padding = Infinity;
      columns.forEach(function (nodes) {
        var thisPadding = (sankeyExtent.y1 * paddingRatio) / (nodes.length + 1);
        padding = thisPadding < padding ? thisPadding : padding;
      });
      graph.py = padding;
    } else {*/
      graph.py = nodePadding;
    //}

    var ky = d3.min(columns, function (nodes) {
      return (
        (graph.y1 - graph.y0 - (nodes.length - 1) * graph.py) /
        d3.sum(nodes, function(d) {
          return d.virtual ? 0 : d.value;
        })
      );
    });

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

    var maxColumn = d3.max(graph.nodes, function (node) {
      return node.column;
    });

    graph.links.forEach(function (link) {
      if (link.circular) {
        if (link.circularLinkType == 'top') {
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
        ? totalTopLinksWidth + verticalMargin + baseRadius
        : totalTopLinksWidth;
    totalBottomLinksWidth =
      totalBottomLinksWidth > 0
        ? totalBottomLinksWidth + verticalMargin + baseRadius
        : totalBottomLinksWidth;
    totalRightLinksWidth =
      totalRightLinksWidth > 0
        ? totalRightLinksWidth + verticalMargin + baseRadius
        : totalRightLinksWidth;
    totalLeftLinksWidth =
      totalLeftLinksWidth > 0
        ? totalLeftLinksWidth + verticalMargin + baseRadius
        : totalLeftLinksWidth;

    var margin = {
      top: totalTopLinksWidth,
      bottom: totalBottomLinksWidth,
      left: totalLeftLinksWidth,
      right: totalRightLinksWidth
    };

    var maxColumn = d3.max(graph.nodes, function (node) {
      return node.column;
    });

    var currentWidth = graph.x1 - graph.x0;
    var currentHeight = graph.y1 - graph.y0;

    var newWidth = currentWidth + margin.right + margin.left;
    var newHeight = currentHeight + margin.top + margin.bottom;

    var scaleX = currentWidth / newWidth;
    var scaleY = currentHeight / newHeight;

    graph.x0 = graph.x0 * scaleX + margin.left;
    graph.x1 = margin.right == 0 ? graph.x1 : graph.x1 * scaleX;
    graph.y0 = graph.y0 * scaleY + margin.top;
    graph.y1 = graph.y1 * scaleY;

    graph.nodes.forEach(function (node) {
      node.x0 =
        graph.x0 +
        node.column * ((graph.x1 - graph.x0 - nodeWidth) / maxColumn);
      node.x1 = node.x0 + /*nodeWidthFunction(node)*/ nodeWidth;
    });

    //re-calculate widths
    graph.ky = graph.ky * scaleY;

    graph.links.forEach(function (link) {
      link.width = link.value * graph.ky;
    });
  }

  return graph;
}

