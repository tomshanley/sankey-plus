import { find } from './find.js';
//import { constant } from './constant.js';
import * as d3 from "https://cdn.skypack.dev/d3@7";
import { findCircuits } from './networks/elementaryCircuits.js';
import { getNodeID, value, numberOfNonSelfLinkingCycles, linkTargetCenter, linkSourceCenter, nodeCenter } from './nodeAttributes.js';
import { selfLinking } from './linkAttributes.js';
import { left, right, center, justify } from './align.js';
import { clone } from './clone.js'; //https://github.com/pvorb/clone
import { ascendingBreadth, ascendingTargetBreadth, ascendingSourceBreadth, sortSourceLinks, sortTargetLinks } from './sortGraph.js';
import { addCircularPathData } from './circularPath.js';
import { adjustSankeySize } from './adjustSankeySize.js';


//internal functions

const _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? function (obj) {
        return typeof obj;
    }
    : function (obj) {
        return obj &&
            typeof Symbol === "function" &&
            obj.constructor === Symbol &&
            obj !== Symbol.prototype
            ? "symbol"
            : typeof obj;
    };

function createMap(arr, id) {
    let m = new Map()

    let nodeByIDGroup = d3.group(arr, id);
    nodeByIDGroup.forEach(function (value, key) {
        m.set(key, value[0])
    })

    return m;

}

function computeNodeLinks(inputGraph, id) {
    //let graph = clone(inputGraph);
    let graph = inputGraph;

    graph.nodes.forEach(function (node, i) {
        node.index = i;
        node.sourceLinks = [];
        node.targetLinks = [];
    });

    //let nodeByID = d3.map(graph.nodes, id);
    let nodeByID = createMap(graph.nodes, id)

    //console.log(nodeByID)

    graph.links.forEach(function (link, i) {
        link.index = i;
        var source = link.source;
        var target = link.target;
        if (
            (typeof source === "undefined" ? "undefined" : _typeof(source)) !==
            'object'
        ) {
            source = link.source = find(nodeByID, source);
        }
        if (
            (typeof target === "undefined" ? "undefined" : _typeof(target)) !==
            'object'
        ) {
            target = link.target = find(nodeByID, target);
        }
        source.sourceLinks.push(link);
        target.targetLinks.push(link);
    });
    return graph;
};

function identifyCircles(inputGraph, sortNodes) {
    //let graph = clone(inputGraph);

    let graph = inputGraph;

    var circularLinkID = 0;
    if (sortNodes === null || sortNodes(graph.nodes[0]) === undefined) {
        // Building adjacency graph
        var adjList = [];
        for (var i = 0; i < graph.links.length; i++) {
            var link = graph.links[i];
            var source = link.source.index;
            var target = link.target.index;
            if (!adjList[source]) adjList[source] = [];
            if (!adjList[target]) adjList[target] = [];

            // Add links if not already in set
            if (adjList[source].indexOf(target) === -1) adjList[source].push(target);
        }

        // Find all elementary circuits
        var cycles = findCircuits(adjList);

        // Sort by circuits length
        cycles.sort(function (a, b) {
            return a.length - b.length;
        });

        var circularLinks = {};
        for (i = 0; i < cycles.length; i++) {
            var cycle = cycles[i];
            var last = cycle.slice(-2);
            if (!circularLinks[last[0]]) circularLinks[last[0]] = {};
            circularLinks[last[0]][last[1]] = true;
        }

        graph.links.forEach(function (link) {
            var target = link.target.index;
            var source = link.source.index;
            // If self-linking or a back-edge
            if (
                target === source ||
                (circularLinks[source] && circularLinks[source][target])
            ) {
                link.circular = true;
                link.circularLinkID = circularLinkID;
                circularLinkID = circularLinkID + 1;
            } else {
                link.circular = false;
            }
        });
    } else {
        graph.links.forEach(function (link) {
            //if (link.source[sortNodes] < link.target[sortNodes]) {
            if (sortNodes(link.source) < sortNodes(link.target)) {
                link.circular = false;
            } else {
                link.circular = true;
                link.circularLinkID = circularLinkID;
                circularLinkID = circularLinkID + 1;
            }
        });
    }

    return graph;
}

// Assign a circular link type (top or bottom), based on:
// - if the source/target node already has circular links, then use the same type
// - if not, choose the type with fewer links
function selectCircularLinkTypes(inputGraph, id) {
    //let graph = clone(inputGraph);
    let graph = inputGraph;

    var numberOfTops = 0;
    var numberOfBottoms = 0;
    graph.links.forEach(function (link) {
        if (link.circular) {
            // if either souce or target has type already use that
            if (link.source.circularLinkType || link.target.circularLinkType) {
                // default to source type if available
                link.circularLinkType = link.source.circularLinkType
                    ? link.source.circularLinkType
                    : link.target.circularLinkType;
            } else {
                link.circularLinkType =
                    numberOfTops < numberOfBottoms ? 'top' : 'bottom';
            }

            if (link.circularLinkType == 'top') {
                numberOfTops = numberOfTops + 1;
            } else {
                numberOfBottoms = numberOfBottoms + 1;
            }

            graph.nodes.forEach(function (node) {
                if (
                    getNodeID(node, id) == getNodeID(link.source, id) ||
                    getNodeID(node, id) == getNodeID(link.target, id)
                ) {
                    node.circularLinkType = link.circularLinkType;
                }
            });
        }
    });

    //correct self-linking links to be same direction as node
    graph.links.forEach(function (link) {
        if (link.circular) {
            //if both source and target node are same type, then link should have same type
            if (link.source.circularLinkType == link.target.circularLinkType) {
                link.circularLinkType = link.source.circularLinkType;
            }
            //if link is selflinking, then link should have same type as node
            if (selfLinking(link, id)) {
                link.circularLinkType = link.source.circularLinkType;
            }
        }
    });

    return graph;
}

function computeNodeValues(inputGraph) {
    //let graph = clone(inputGraph);

    let graph = inputGraph;

    graph.nodes.forEach(function (node) {
        node.partOfCycle = false;
        node.value = Math.max(
            d3.sum(node.sourceLinks, value),
            d3.sum(node.targetLinks, value)
        );
        node.sourceLinks.forEach(function (link) {
            if (link.circular) {
                node.partOfCycle = true;
                node.circularLinkType = link.circularLinkType;
            }
        });
        node.targetLinks.forEach(function (link) {
            if (link.circular) {
                node.partOfCycle = true;
                node.circularLinkType = link.circularLinkType;
            }
        });
    });

    return graph;
}

function computeNodeDepths(inputGraph, sortNodes, align) {
    //let graph = clone(inputGraph);

    let graph = inputGraph;

    var nodes, next, x;

    if (sortNodes != null && sortNodes(graph.nodes[0]) != undefined) {
        graph.nodes.sort(function (a, b) {
            return sortNodes(a) < sortNodes(b) ? -1 : 1;
        });

        let c = 0;
        var currentSortIndex = sortNodes(graph.nodes[0]);

        graph.nodes.forEach(function (node) {
            c = sortNodes(node) == currentSortIndex ? c : c + 1;

            currentSortIndex =
                sortNodes(node) == currentSortIndex
                    ? currentSortIndex
                    : sortNodes(node);
            node.column = c;
        });
    }

    for (
        nodes = graph.nodes, next = [], x = 0;
        nodes.length;
        ++x, nodes = next, next = []
    ) {
        nodes.forEach(function (node) {
            node.depth = x;
            node.sourceLinks.forEach(function (link) {
                if (next.indexOf(link.target) < 0 && !link.circular) {
                    next.push(link.target);
                }
            });
        });
    }

    for (
        nodes = graph.nodes, next = [], x = 0;
        nodes.length;
        ++x, nodes = next, next = []
    ) {
        nodes.forEach(function (node) {
            node.height = x;
            node.targetLinks.forEach(function (link) {
                if (next.indexOf(link.source) < 0 && !link.circular) {
                    next.push(link.source);
                }
            });
        });
    }

    //console.log(sortNodes(graph.nodes[0]));

    // assign column numbers, and get max value
    graph.nodes.forEach(function (node) {
        node.column =
            sortNodes == null || sortNodes(graph.nodes[0]) == undefined
                ? align(node, x)
                : node.column;

        //node.column = Math.floor(align.call(null, node, x));
    });

    return graph;
}

function createVirtualNodes(inputGraph, useVirtualRoutes, id) {
    //let graph = clone(inputGraph);

    let graph = inputGraph;

    graph.replacedLinks = [];

    if (useVirtualRoutes) {
        let virtualNodeIndex = -1;
        let virtualLinkIndex = 0;
        let linksLength = graph.links.length;

        for (var linkIndex = 0; linkIndex < linksLength; linkIndex++) {
            var thisLink = graph.links[linkIndex];

            /*
            console.log("+++++++++++++++++ ");
            console.log(
              thisLink.index +
                "  -   columns " +
                thisLink.source.column +
                "  <-> " +
                thisLink.target.column
            );
            */

            //if the link spans more than 1 column, then replace it with virtual nodes and links
            if (thisLink.target.column - thisLink.source.column < 2) {
                thisLink.type = "normal";
            } else {
                //console.log("NEEDS NEW VIRTUAL LINKS");
                //console.log("link index: " + thisLink.index);

                thisLink.type = "replaced";

                let totalToCreate = thisLink.target.column - thisLink.source.column - 1;
                //console.log("total nodes to create: " + totalToCreate);

                for (var n = 0; n < totalToCreate; n++) {
                    let newNode = {};

                    //get the next index number
                    virtualNodeIndex = virtualNodeIndex + 1;
                    newNode.name = "virtualNode" + virtualNodeIndex;
                    newNode.index = "v" + virtualNodeIndex;

                    //console.log(" created node: " + newNode.name);

                    newNode.sourceLinks = [];
                    newNode.targetLinks = [];
                    newNode.partOfCycle = false;
                    newNode.value = thisLink.value;
                    newNode.depth = thisLink.source.depth + (n + 1);
                    newNode.height = thisLink.source.height - (n + 1);
                    newNode.column = thisLink.source.column + (n + 1);
                    newNode.virtual = true;
                    newNode.replacedLink = thisLink.index;

                    graph.nodes.push(newNode);

                    let newLink = {};
                    let vMinus1 = virtualNodeIndex - 1;
                    newLink.source = n == 0 ? thisLink.source : "virtualNode" + vMinus1;
                    newLink.target = newNode.name;
                    newLink.value = thisLink.value;
                    newLink.index = "virtualLink" + virtualLinkIndex;
                    virtualLinkIndex = virtualLinkIndex + 1;
                    newLink.circular = false;
                    newLink.type = "virtual";
                    newLink.parentLink = thisLink.index;

                    //console.log(newLink);

                    graph.links.push(newLink);
                }

                let lastLink = {};
                lastLink.source = "virtualNode" + virtualNodeIndex;
                lastLink.target = thisLink.target;

                lastLink.value = thisLink.value;
                lastLink.index = "virtualLink" + virtualLinkIndex;
                virtualLinkIndex = virtualLinkIndex + 1;
                lastLink.circular = false;
                lastLink.type = "virtual";
                lastLink.parentLink = thisLink.index;

                //console.log(lastLink);

                graph.links.push(lastLink);
            }
        }

        //console.log(graph.links);

        //var nodeById = d3.map(graph.nodes, id);

        let nodeByID = createMap(graph.nodes, id)

        //console.log(nodeByID)

        graph.links.forEach(function (link, i) {
            if (link.type == "virtual") {
                var source = link.source;
                var target = link.target;
                if (
                    (typeof source === "undefined" ? "undefined" : _typeof(source)) !==
                    'object'
                ) {
                    //console.log(source);
                    //console.log(find(nodeById, source));
                    source = link.source = find(nodeByID, source);
                }
                if (
                    (typeof target === "undefined" ? "undefined" : _typeof(target)) !==
                    'object'
                ) {
                    target = link.target = find(nodeByID, target);
                }
                source.sourceLinks.push(link);
                target.targetLinks.push(link);
            }
        });

        let l = graph.links.length;
        while (l--) {
            if (graph.links[l].type == "replaced") {
                let obj = clone(graph.links[l]);
                graph.links.splice(l, 1);
                graph.replacedLinks.push(obj);
            }
        }

        graph.nodes.forEach(function (node) {
            let sIndex = node.sourceLinks.length;
            while (sIndex--) {
                if (node.sourceLinks[sIndex].type == "replaced") {
                    node.sourceLinks.splice(sIndex, 1);
                }
            }

            let tIndex = node.targetLinks.length;
            while (tIndex--) {
                if (node.targetLinks[tIndex].type == "replaced") {
                    node.targetLinks.splice(tIndex, 1);
                }
            }
        });
    }

    return graph;
}

// Assign nodes' breadths, and then shift nodes that overlap (resolveCollisions)
function computeNodeBreadths(inputGraph, setNodePositions, id) {
    //let graph = clone(inputGraph);

    let graph = inputGraph;

    let columns = d3.groups(graph.nodes, d => d.column)
        .sort((a, b) => a[0] - b[0])
        .map(d => d[1])


    columns.forEach(function (nodes) {

        let nodesLength = nodes.length;

        let totalColumnValue = nodes.reduce(function (total, d) {
            return total + d.value;
        }, 0);

        let preferredTotalGap = graph.y1 - graph.y0 - totalColumnValue * graph.ky;

        nodes.sort(function (a, b) {
            if (a.circularLinkType == b.circularLinkType) {
                return (
                    numberOfNonSelfLinkingCycles(b, id) -
                    numberOfNonSelfLinkingCycles(a, id)
                );
            } else if (
                a.circularLinkType == "top" &&
                b.circularLinkType == "bottom"
            ) {
                return -1;
            } else if (a.circularLinkType == "top" && b.partOfCycle == false) {
                return -1;
            } else if (a.partOfCycle == false && b.circularLinkType == "bottom") {
                return -1;
            }
        });

        if (setNodePositions) {
            let currentY = graph.y0;

            nodes.forEach(function (node, i) {
                if (nodes.length == 1) {
                    node.y0 = sankeyExtent.y1 / 2 - node.value * graph.ky;
                    node.y1 = node.y0 + node.value * graph.ky;
                } else {
                    node.y0 = currentY;
                    node.y1 = node.y0 + node.value * graph.ky;
                    currentY = node.y1 + preferredTotalGap / (nodes.length - 1);
                }
            });
        } else {
            nodes.forEach(function (node, i) {

                // if the node is in the last column, and is the only node in that column, put it in the centre
                if (node.depth == columns.length - 1 && nodesLength == 1) {
                    node.y0 = graph.y1 / 2 - node.value * graph.ky;
                    node.y1 = node.y0 + node.value * graph.ky;

                    // if the node is in the first column, and is the only node in that column, put it in the centre
                } else if (node.depth == 0 && nodesLength == 1) {
                    node.y0 = graph.y1 / 2 - node.value * graph.ky;
                    node.y1 = node.y0 + node.value * graph.ky;
                }

                // if the node has a circular link
                else if (node.partOfCycle) {
                    // if the node has no self links
                    if (numberOfNonSelfLinkingCycles(node, id) == 0) {
                        node.y0 = graph.y1 / 2 + i;
                        node.y1 = node.y0 + node.value * graph.ky;
                    } else if (node.circularLinkType == 'top') {
                        node.y0 = graph.y0 + i;
                        node.y1 = node.y0 + node.value * graph.ky;
                    } else {
                        node.y0 = graph.y1 - node.value * graph.ky - i;
                        node.y1 = node.y0 + node.value * graph.ky;
                    }
                } else {
                    //TO DO CONFIRM WHERE TOP AND BOTTOM CAME FROM
                    //if (graph.y0.top == 0 || graph.y1.bottom == 0) {
                    if (graph.y0 == 0 || graph.y1 == 0) {
                        node.y0 = ((graph.y1 - graph.y0) / nodesLength) * i;
                        node.y1 = node.y0 + node.value * graph.ky;
                    } else {
                        node.y0 = (graph.y1 - graph.y0) / 2 - nodesLength / 2 + i;
                        node.y1 = node.y0 + node.value * graph.ky;
                    }
                }
            });
        }
    });

    return graph;
}

function resolveCollisionsAndRelax(inputGraph, id, nodePadding, minNodePadding, iterations) {
    //let graph = clone(inputGraph);

    let graph = inputGraph;

    let columns = d3.groups(graph.nodes, d => d.column)
        .sort((a, b) => a[0] - b[0])
        .map(d => d[1])

    /*var columns = d3
      .nest()
      .key(function(d) {
        return d.column;
      })
      .sortKeys(d3.ascending)
      .entries(graph.nodes)
      .map(function(d) {
        return d.values;
      });*/



    resolveCollisions();

    for (var alpha = 1, n = iterations; n > 0; --n) {
        relaxLeftAndRight((alpha *= 0.99), id);
        resolveCollisions();
    }

    // For each node in each column, check the node's vertical position in relation to its targets and sources vertical position
    // and shift up/down to be closer to the vertical middle of those targets and sources
    function relaxLeftAndRight(alpha, id) {
        var columnsLength = columns.length;

        columns.forEach(function (nodes) {
            var n = nodes.length;
            var depth = nodes[0].depth;

            nodes.forEach(function (node) {
                // check the node is not an orphan
                var nodeHeight;
                if (node.sourceLinks.length || node.targetLinks.length) {
                    if (node.partOfCycle && numberOfNonSelfLinkingCycles(node, id) > 0);
                    else if (depth == 0 && n == 1) {
                        nodeHeight = node.y1 - node.y0;

                        node.y0 = graph.y1 / 2 - nodeHeight / 2;
                        node.y1 = graph.y1 / 2 + nodeHeight / 2;
                    } else if (depth == columnsLength - 1 && n == 1) {
                        nodeHeight = node.y1 - node.y0;

                        node.y0 = graph.y1 / 2 - nodeHeight / 2;
                        node.y1 = graph.y1 / 2 + nodeHeight / 2;
                    } else {
                        var avg = 0;

                        var avgTargetY = d3.mean(node.sourceLinks, linkTargetCenter);
                        var avgSourceY = d3.mean(node.targetLinks, linkSourceCenter);

                        if (avgTargetY && avgSourceY) {
                            avg = (avgTargetY + avgSourceY) / 2;
                        } else {
                            avg = avgTargetY || avgSourceY;
                        }

                        var dy = (avg - nodeCenter(node)) * alpha;
                        // positive if it node needs to move down
                        node.y0 += dy;
                        node.y1 += dy;
                    }
                }
            });
        });
    }

    // For each column, check if nodes are overlapping, and if so, shift up/down
    function resolveCollisions() {
        columns.forEach(function (nodes) {
            var node,
                dy,
                y = graph.y0,
                n = nodes.length,
                i;

            // Push any overlapping nodes down.
            nodes.sort(ascendingBreadth);

            for (i = 0; i < n; ++i) {
                node = nodes[i];
                dy = y - node.y0;

                if (dy > 0) {
                    node.y0 += dy;
                    node.y1 += dy;
                }
                y = node.y1 + nodePadding;
            }

            // If the bottommost node goes outside the bounds, push it back up.
            dy = y - nodePadding - graph.y1;
            if (dy > 0) {
                (y = node.y0 -= dy), (node.y1 -= dy);

                // Push any overlapping nodes back up.
                for (i = n - 2; i >= 0; --i) {
                    node = nodes[i];
                    dy = node.y1 + minNodePadding /*nodePadding*/ - y;
                    if (dy > 0) (node.y0 -= dy), (node.y1 -= dy);
                    y = node.y0;
                }
            }
        });
    }

    return graph;
}

// Assign the links y0 and y1 based on source/target nodes position,
// plus the link's relative position to other links to the same node
function computeLinkBreadths(inputGraph) {
    //let graph = clone(inputGraph);
    let graph = inputGraph;

    graph.nodes.forEach(function (node) {
        node.sourceLinks.sort(ascendingTargetBreadth);
        node.targetLinks.sort(ascendingSourceBreadth);
    });
    graph.nodes.forEach(function (node) {
        var y0 = node.y0;
        var y1 = y0;

        // start from the bottom of the node for cycle links
        var y0cycle = node.y1;
        var y1cycle = y0cycle;

        node.sourceLinks.forEach(function (link) {
            if (link.circular) {
                link.y0 = y0cycle - link.width / 2;
                y0cycle = y0cycle - link.width;
            } else {
                link.y0 = y0 + link.width / 2;
                y0 += link.width;
            }
        });
        node.targetLinks.forEach(function (link) {
            if (link.circular) {
                link.y1 = y1cycle - link.width / 2;
                y1cycle = y1cycle - link.width;
            } else {
                link.y1 = y1 + link.width / 2;
                y1 += link.width;
            }
        });
    });

    return graph;
}

function straigtenVirtualNodes(inputGraph) {
    //let graph = clone(inputGraph);
    let graph = inputGraph;

    graph.nodes.forEach(function (node) {
        if (node.virtual) {
            //let nodeHeight = node.y1 - node.y0;
            let dy = 0;

            //if the node is linked to another virtual node, get the difference in y
            //select the node which precedes it first, else get the node after it
            if (node.targetLinks[0].source.virtual) {
                dy = node.targetLinks[0].source.y0 - node.y0;
            } else if (node.sourceLinks[0].target.virtual) {
                dy = node.sourceLinks[0].target.y0 - node.y0;
            }

            node.y0 = node.y0 + dy;
            node.y1 = node.y1 + dy;

            node.targetLinks.forEach(function (l) {
                l.y1 = l.y1 + dy;
            });

            node.sourceLinks.forEach(function (l) {
                l.y0 = l.y0 + dy;
            });
        }
    });

    return graph;
}

function fillHeight(inputGraph) {
    //let graph = clone(inputGraph);
    let graph = inputGraph;

    var nodes = graph.nodes;
    var links = graph.links;

    var top = false;
    var bottom = false;

    links.forEach(function (link) {
        if (link.circularLinkType == "top") {
            top = true;
        } else if (link.circularLinkType == "bottom") {
            bottom = true;
        }
    });

    if (top == false || bottom == false) {
        var minY0 = d3.min(nodes, function (node) {
            return node.y0;
        });

        var maxY1 = d3.max(nodes, function (node) {
            return node.y1;
        });

        var currentHeight = maxY1 - minY0;
        var chartHeight = graph.y1 - graph.y0;
        var ratio = chartHeight / currentHeight;

        let moveScale = d3
            .scaleLinear()
            .domain([minY0, maxY1])
            .range([graph.y0, graph.y1]);

        nodes.forEach(function (node) {
            /*var nodeHeight = (node.y1 - node.y0) * ratio;
            node.y0 = (node.y0 - minY0) * ratio;
            node.y1 = node.y0 + nodeHeight;*/
            node.y0 = moveScale(node.y0)
            node.y1 = moveScale(node.y1)
        });

        links.forEach(function (link) {
            //link.y0 = (link.y0 - minY0) * ratio;
            //link.y1 = (link.y1 - minY0) * ratio;
            link.y0 = moveScale(link.y0)
            link.y1 = moveScale(link.y1)
            link.width = link.width * ratio;
        });
    }

    return graph;
}

function addVirtualPathData(inputGraph, virtualLinkType) {
    let graph = clone(inputGraph);

    graph.virtualLinks = [];
    graph.virtualNodes = [];

    graph.replacedLinks.forEach(function (replacedLink) {
        replacedLink.useVirtual = virtualLinkType == "virtual" ? true : false;

        let firstPath = true;

        for (let i = 0; i < graph.links.length; i++) {
            if (graph.links[i].parentLink == replacedLink.index) {
                if (firstPath) {
                    replacedLink.y0 = graph.links[i].y0;
                    replacedLink.x0 = graph.links[i].source.x1;
                    replacedLink.width = graph.links[i].width;
                    firstPath = false;
                } else {
                    replacedLink.y1 = graph.links[i].y1;
                    replacedLink.x1 = graph.links[i].target.x0;
                }
            }
        }

        if (virtualLinkType == "both") {
            let columnToTest = replacedLink.source.column + 1;
            let maxColumnToTest = replacedLink.target.column - 1;
            let i = 1;
            let numberOfColumnsToTest = maxColumnToTest - columnToTest + 1;

            for (i = 1; columnToTest <= maxColumnToTest; columnToTest++, i++) {
                graph.nodes.forEach(function (node) {
                    if (
                        node.column == columnToTest &&
                        node.replacedLink != replacedLink.index
                    ) {
                        var t = i / (numberOfColumnsToTest + 1);

                        // Find all the points of a cubic bezier curve in javascript
                        // https://stackoverflow.com/questions/15397596/find-all-the-points-of-a-cubic-bezier-curve-in-javascript

                        var B0_t = Math.pow(1 - t, 3);
                        var B1_t = 3 * t * Math.pow(1 - t, 2);
                        var B2_t = 3 * Math.pow(t, 2) * (1 - t);
                        var B3_t = Math.pow(t, 3);

                        var py_t =
                            B0_t * replacedLink.y0 +
                            B1_t * replacedLink.y0 +
                            B2_t * replacedLink.y1 +
                            B3_t * replacedLink.y1;

                        var linkY0AtColumn = py_t - replacedLink.width / 2;
                        var linkY1AtColumn = py_t + replacedLink.width / 2;

                        if (linkY0AtColumn > node.y0 && linkY0AtColumn < node.y1) {
                            replacedLink.useVirtual = true;
                        } else if (linkY1AtColumn > node.y0 && linkY1AtColumn < node.y1) {
                            replacedLink.useVirtual = true;
                        } else if (linkY0AtColumn < node.y0 && linkY1AtColumn > node.y1) {
                            replacedLink.useVirtual = true;
                        }
                    }
                });
            }
        }
    });

    //create d path string
    graph.replacedLinks.forEach(function (replacedLink) {
        //replacedLink.width = replacedLink.value * graph.ky;

        if (replacedLink.useVirtual) {
            let pathString = "";
            let firstPath = true;

            for (let i = 0; i < graph.links.length; i++) {
                if (graph.links[i].parentLink == replacedLink.index) {
                    if (firstPath) {
                        pathString = pathString + graph.links[i].path;
                        firstPath = false;
                    } else {
                        pathString = pathString + graph.links[i].path.replace("M", "L");
                    }
                }
            }

            replacedLink.path = pathString;
        } else {
            var normalPath = d3
                .linkHorizontal()
                .source(function (d) {
                    var x = d.x0;
                    var y = d.y0;
                    return [x, y];
                })
                .target(function (d) {
                    var x = d.x1;
                    var y = d.y1;
                    return [x, y];
                });
            replacedLink.path = normalPath(replacedLink);
        }

        let copy = clone(replacedLink);
        graph.links.push(copy);
    });

    let l = graph.links.length;
    while (l--) {
        if (graph.links[l].type == "virtual") {
            let obj = clone(graph.links[l]);
            graph.links.splice(l, 1);
            graph.virtualLinks.push(obj);
        }
    }

    let n = graph.nodes.length;
    while (n--) {
        if (graph.nodes[n].virtual) {
            let obj = clone(graph.nodes[n]);
            graph.nodes.splice(n, 1);
            graph.virtualNodes.push(obj);
        }
    }

    return graph;
}

class SankeyChart {

    constructor(el,  config) {

        if(!config.nodes.data) {
            throw  'Please supply node data';
        } 

        if(!config.links.data) {
            throw 'Please supply links data' ;
        }

        this.el = el;

        const defaultOptions = {
            align: "left",
            id: d => d.name,
            iterations: 32,
            extent: [[0, 0,], [1, 1]],
            padding: 20,
            width: 1000,
            height: 500,
            useManualScale: false,
            scale: 0.3,
            nodes: {
                //data: nodes,
                width: 24, //dx
                scaleDomain: [0, 75],  //maxHeight
                scaleRange: [0, 75],   //maxValue
                padding: 25,
                minPadding: 25,
                virtualPadding: 7,
                sort: null,
                setPositions: false,
                fill: "grey",
                stroke: "none",
                opacity: 1
            },
            links: {
                //data: links,
                circularGap: 5,
                circularLinkPortionTopBottom: 0.4,
                circularLinkPortionLeftRight: 0.1,
                opacity: 1,
                useVirtualRoutes: true,
                baseRadius: 10,
                verticalMargin: 25,
                virtualLinkType: "both",  // ["both", "bezier", "virtual"]
                color: 'lightgrey'
            },
            arrows: {
                enabled: false,
                color: 'DarkSlateGrey',
                length: 10,
                gap: 25,
                headSize: 4
            }

        };

        //let config = defaultOptions

        this.config = Object.assign({}, defaultOptions, config);
        this.config.nodes = Object.assign({}, defaultOptions.nodes, config.nodes);
        this.config.links = Object.assign({}, defaultOptions.links, config.links);
        this.config.arrows = Object.assign({}, defaultOptions.arrows, config.arrows);

        let sortNodes = this.config.nodes.sort
            ? function (node) {
                return node.sort;
            }
            : null

        let align = this.config.align == "left" ? left :
            this.config.align == "right" ? right :
                this.config.align == "center" ? center :
                    this.config.align == "center" ? center : justify;

        //create associations and addtional data
        this.graph = computeNodeLinks({
            nodes: config.nodes.data,
            links: config.links.data
        }, this.config.id);


        this.graph.x0 = this.config.padding;
        this.graph.y0 = this.config.padding;
        this.graph.x1 = this.config.width + this.config.padding;
        this.graph.y1 = this.config.height + this.config.padding;
        this.graph.py = 0;


        this.graph = identifyCircles(this.graph, sortNodes);
        this.graph = selectCircularLinkTypes(this.graph, this.config.id);
        this.graph = computeNodeValues(this.graph);
        this.graph = computeNodeDepths(this.graph, sortNodes, align);
        this.graph = createVirtualNodes(this.graph, this.config.links.useVirtualRoutes, this.config.id);
        this.graph = adjustSankeySize(this.graph,
            this.config.useManualScale,
            this.config.nodes.padding,
            this.config.nodes.width,
            //this.config.nodes.maxHeight,
            this.config.nodes.scaleDomain,
            this.config.nodes.scaleRange,
            this.config.links.circularLinkPortionTopBottom,
            this.config.links.circularLinkPortionLeftRight,
            this.config.scale);
        this.graph = computeNodeBreadths(this.graph, this.config.nodes.setPositions, this.config.id);
        this.graph = resolveCollisionsAndRelax(this.graph, this.config.id, this.config.nodes.padding, this.config.nodes.minPadding, this.config.iterations);
        this.graph = computeLinkBreadths(this.graph);
        this.graph = addCircularPathData(this.graph,
            this.config.id,
            this.config.links.circularGap,
            this.config.links.baseRadius,
            this.config.links.verticalMargin);
        this.graph = straigtenVirtualNodes(this.graph);
        this.graph = sortSourceLinks(this.graph, this.config.id);
        this.graph = sortTargetLinks(this.graph, this.config.id);
        this.graph = fillHeight(this.graph);
        this.graph = addCircularPathData(this.graph,
            this.config.id,
            this.config.links.circularGap,
            this.config.links.baseRadius,
            this.config.links.verticalMargin);
        this.graph = addVirtualPathData(this.graph, this.config.links.virtualLinkType);


        //not using resolveLinkOverlaps at the mo


    };

    redraw() {
        this.el.selectChildren().remove();

        let svg = this.el.append("svg")
            .attr("width", this.config.width + this.config.padding + this.config.padding)
            .attr("height", this.config.height + this.config.padding + this.config.padding);

        let g = svg
            .append("g")
            .attr("transform", "translate(0,0)");

        let linkG = g
            .append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke-opacity", this.config.links.opacity)
            .selectAll("path");

        let nodeG = g
            .append("g")
            .attr("class", "nodes")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .selectAll("g");

        let node = nodeG
            .data(this.graph.nodes)
            .enter()
            .append("g");

        node
            .append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .style("fill", this.config.nodes.fill)
            .style("stroke",  this.config.nodes.stroke)
            .style("opacity", this.config.nodes.opacity)
        

        node
            .append("text")
            .attr("x", d => (d.x0 + d.x1) / 2)
            .attr("y", d => d.y0 - 8)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(this.config.id)
            //.text(d => d.name);

        node.append("title").text(function (d) {
            return d.name + "\n" + d.value;
        });

        var link = linkG
            .data(this.graph.links)
            .enter()
            .append("g");

        link
            .filter(d => d.path)
            .append("path")
            .attr("class", "sankey-link")
            .attr("d", d => d.path)
            .style("stroke-width", d => Math.max(1, d.width))
            //.style("mix-blend-mode", "multiply")
            //.style("opacity", 0.7)
            .style("stroke", this.config.links.color)
            /*.style("stroke", function (link, i) {
                if (link.circular) {
                    return "red";
                } else if (link.type == "virtual") {
                    return "yellow";
                } else if (link.type == "replaced") {
                    return "blue";
                } else {
                    return 'grey';
                    //return nodeColour(link.source.name);
                }
                //return link.circular ? "red" : "black";
            });*/

        link.append("title").text(function (d) {
            return d.source.name + " → " + d.target.name + "\n Index: " + d.index;
        });

        svg
            .append('rect')
            .attr('width', this.config.width + this.config.padding + this.config.padding)
            .attr('height', this.config.height + this.config.padding + this.config.padding)
            .style('fill', 'none')
            .style('stroke', 'red')

        svg
            .append('rect')
            .attr('x', this.config.padding)
            .attr('y', this.config.padding)
            .attr('width', this.config.width)
            .attr('height', this.config.height)
            .style('fill', 'none')
            .style('stroke', 'blue')

        svg
            .append('rect')
            .attr('x', this.graph.x0)
            .attr('y', this.graph.y0)
            .attr('width', this.graph.x1 - this.graph.x0)
            .attr('height', this.graph.y1 - this.graph.y0)
            .style('fill', 'none')
            .style('stroke', 'green')

        if (this.config.arrows.enabled) {

            let arrowLength = this.config.arrows.length;
            let gapLength = this.config.arrows.gap;
            let headSize = this.config.arrows.headSize;
            let arrowColor = this.config.arrows.color;

            let totalDashArrayLength = arrowLength + gapLength;


            var arrowsG = linkG
                .data(this.graph.links)
                .enter()
                .append("g")
                .attr("class", "g-arrow");

            let arrows = arrowsG
                .append('path')
                .attr('d', d => d.path)
                .style('stroke-width', 1)
                .style('stroke', arrowColor)
                .style('stroke-dasharray', arrowLength + ',' + gapLength);

            arrows.each(function (arrow) {

                let thisPath = d3.select(this).node();
                let parentG = d3.select(this.parentNode);
                let pathLength = thisPath.getTotalLength();
                let numberOfArrows = Math.ceil(pathLength / totalDashArrayLength);

                // remove the last arrow head if it will overlap the target node
                if (
                    (numberOfArrows - 1) * totalDashArrayLength +
                    (arrowLength + (headSize + 1)) >
                    pathLength
                ) {
                    numberOfArrows = numberOfArrows - 1;
                }

                let arrowHeadData = d3.range(numberOfArrows).map(function (d, i) {
                    let length = i * totalDashArrayLength + arrowLength;

                    let point = thisPath.getPointAtLength(length);
                    let previousPoint = thisPath.getPointAtLength(length - 2);

                    let rotation = 0;

                    if (point.y == previousPoint.y) {
                        rotation = point.x < previousPoint.x ? 180 : 0;
                    } else if (point.x == previousPoint.x) {
                        rotation = point.y < previousPoint.y ? -90 : 90;
                    } else {
                        let adj = Math.abs(point.x - previousPoint.x);
                        let opp = Math.abs(point.y - previousPoint.y);
                        let angle = Math.atan(opp / adj) * (180 / Math.PI);
                        if (point.x < previousPoint.x) {
                            angle = angle + (90 - angle) * 2;
                        }
                        if (point.y < previousPoint.y) {
                            rotation = -angle;
                        } else {
                            rotation = angle;
                        }
                    }

                    return { x: point.x, y: point.y, rotation: rotation };
                });


                parentG
                    .selectAll('.arrow-heads')
                    .data(arrowHeadData)
                    .enter()
                    .append('path')
                    .attr('d', function (d) {
                        return (
                            'M' +
                            d.x +
                            ',' +
                            (d.y - headSize / 2) +
                            ' ' +
                            'L' +
                            (d.x + headSize) +
                            ',' +
                            d.y +
                            ' ' +
                            'L' +
                            d.x +
                            ',' +
                            (d.y + headSize / 2)
                        );
                    })
                    .attr('class', 'arrow-head')
                    .attr('transform', function (d) {
                        return 'rotate(' + d.rotation + ',' + d.x + ',' + d.y + ')';
                    })
                    .style('fill', arrowColor);
            });
        }
    }



}; // END OF REDRAW()

export { SankeyChart };