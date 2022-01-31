import * as d3 from "d3";

/* 
Examples: This module contains examples on how to apply 
* verticalSort
* horizontalSort
properties to the nodes. 
The values of this property will be used to sort the Sankey if set to true
*/

/* 
Example: Add sort property to nodes
We will use the amount of incoming links for each node and create four groups
*/
export const applyHorizontalSort = (data) => {
    const sortValue = (node) => {
        const links = data.links.filter((d) => d.source === node.name);
        const sourceSum = d3.sum(links, (d) => d.value);

        return sourceSum > 400 
        ? 1
        : sourceSum > 40
        ? 2
        : sourceSum > 20
        ? 3
        : 4
    };

    data.nodes.map((d) => {
        d.horizontalSort = sortValue(d);
        return d;
    });

    return data.nodes;
};

/* 
Example: Add vertical sort property to nodes
We will use alphabetical order
*/
export const applyVerticalSort = (data) => {
    const byLabel = (a, b) => (b.name > a.name ? 1 : -1);
    data.nodes.sort(byLabel);
    data.nodes.map((d, i) => {
        d.verticalSort = i + 1;
        return d;
    });

  return data.nodes; // node.sourceLinks.length - 100;  
};