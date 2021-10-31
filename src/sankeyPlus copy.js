import { find } from './find.js';

/*export {SankeyChart};

export default function () {

    //default values
    x0 = 0,
        y0 = 0,
        x1 = 1,
        y1 = 1, // extent
        dx = 24, // nodeWidth
        py, // nodePadding, for vertical postioning
        id = defaultId,
        align = justify,
        nodes = defaultNodes,
        links = defaultLinks,
        iterations = 32,
        circularLinkGap = 5,
        paddingRatio,
        nodePadding = 25,
        minNodePadding = 25,
        virtualNodePadding = 7,
        sortNodes = null;



    class SankeyChart {

        constructor(nodes, links){
            this.nodes = nodes;
            this.links = links;
        }
        /*let graph = {
            nodes: nodes.apply(null, arguments),
            links: links.apply(null, arguments)

        }*/
    }

}


function computeNodeLinks(inputGraph) {
    let graph = clone(inputGraph);

    graph.nodes.forEach(function (node, i) {
        node.index = i;
        node.sourceLinks = [];
        node.targetLinks = [];
    });
    var nodeById = d3.map(graph.nodes, id);
    graph.links.forEach(function (link, i) {
        link.index = i;
        var source = link.source;
        var target = link.target;
        if (
            (typeof source === "undefined" ? "undefined" : _typeof(source)) !==
            'object'
        ) {
            source = link.source = find(nodeById, source);
        }
        if (
            (typeof target === "undefined" ? "undefined" : _typeof(target)) !==
            'object'
        ) {
            target = link.target = find(nodeById, target);
        }
        source.sourceLinks.push(link);
        target.targetLinks.push(link);
    });
    return graph;
}