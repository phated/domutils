import { Node } from "domhandler";
import { hasChildren } from "./tagtypes";

/**
 * Given an array of nodes, remove any member that is contained by another.
 *
 * @param nodes — Nodes to filter.
 */
export function removeSubsets(nodes: Node[]): Node[] {
    let idx = nodes.length;

    // Check if each node (or one of its ancestors) is already contained in the
    // array.
    while (--idx >= 0) {
        const node = nodes[idx];

        // Remove the node if it is not unique.
        // We are going through the array from the end, so we only
        // have to check nodes that preceed the node under consideration in the array.
        if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
            nodes.splice(idx, 1);
            continue;
        }

        for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
            if (nodes.indexOf(ancestor) > -1) {
                nodes.splice(idx, 1);
                break;
            }
        }
    }

    return nodes;
}

// Source: http://dom.spec.whatwg.org/#dom-node-comparedocumentposition
export const enum DocumentPosition {
    DISCONNECTED = 1,
    PRECEDING = 2,
    FOLLOWING = 4,
    CONTAINS = 8,
    CONTAINED_BY = 16
}

/***
 * Compare the position of one node against another node in any other document.
 * The return value is a bitmask with the following values:
 *
 * document order:
 * > There is an ordering, document order, defined on all the nodes in the
 * > document corresponding to the order in which the first character of the
 * > XML representation of each node occurs in the XML representation of the
 * > document after expansion of general entities. Thus, the document element
 * > node will be the first node. Element nodes occur before their children.
 * > Thus, document order orders element nodes in order of the occurrence of
 * > their start-tag in the XML (after expansion of entities). The attribute
 * > nodes of an element occur after the element and before its children. The
 * > relative order of attribute nodes is implementation-dependent./
 *
 * Source:
 * http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
 * @argument nodaA The first node to use in the comparison
 * @argument nodeB The second node to use in the comparison
 *
 * @return A bitmask describing the input nodes' relative position.
 *
 *        See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
 *        a description of these values.
 */
export function compareDocumentPosition(nodeA: Node, nodeB: Node): number {
    const aParents = [];
    const bParents = [];

    if (nodeA === nodeB) {
        return 0;
    }

    let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
    while (current) {
        aParents.unshift(current);
        current = current.parent;
    }
    current = hasChildren(nodeB) ? nodeB : nodeB.parent;
    while (current) {
        bParents.unshift(current);
        current = current.parent;
    }

    let idx = 0;
    while (aParents[idx] === bParents[idx]) {
        idx++;
    }

    if (idx === 0) {
        return DocumentPosition.DISCONNECTED;
    }

    const sharedParent = aParents[idx - 1];
    const siblings = sharedParent.children;
    const aSibling = aParents[idx];
    const bSibling = bParents[idx];

    if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
        if (sharedParent === nodeB) {
            return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
        }
        return DocumentPosition.FOLLOWING;
    } else {
        if (sharedParent === nodeA) {
            return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
        }
        return DocumentPosition.PRECEDING;
    }
}

/***
 * Sort an array of nodes based on their relative position in the document and
 * remove any duplicate nodes. If the array contains nodes that do not belong
 * to the same document, sort order is unspecified.
 *
 * @argument nodes Array of DOM nodes
 * @returns collection of unique nodes, sorted in document order
 */
export function uniqueSort(nodes: Node[]): Node[] {
    nodes = nodes.filter((node, i, arr) => !arr.includes(node, i + 1));

    nodes.sort((a, b) => {
        const relative = compareDocumentPosition(a, b);
        if (relative & DocumentPosition.PRECEDING) {
            return -1;
        } else if (relative & DocumentPosition.FOLLOWING) {
            return 1;
        }
        return 0;
    });

    return nodes;
}
