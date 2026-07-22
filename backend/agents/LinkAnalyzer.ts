import { store } from '../server/in-memory-store';
import type { GraphData, GraphNode, GraphLink } from '../server/crime-models';

export class LinkAnalyzer {
  analyze(depth: number = 2): GraphData {
    return store.buildGraphData(depth);
  }

  analyzeForSuspect(suspectId: number): GraphData {
    const suspect = store.getSuspect(suspectId);
    if (!suspect) return { nodes: [], links: [] };

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeSet = new Set<string>();

    const suspectNodeId = `suspect-${suspect.ROWID}`;
    nodes.push({ id: suspectNodeId, label: suspect.name, type: 'suspect', data: suspect });
    nodeSet.add(suspectNodeId);

    const suspectLinks = store.getLinksForSuspect(suspect.ROWID);
    for (const link of suspectLinks) {
      const crime = store.getCrimeById(link.crimeId);
      if (crime) {
        const crimeId = `crime-${crime.ROWID}`;
        if (!nodeSet.has(crimeId)) {
          nodes.push({ id: crimeId, label: `FIR ${crime.firNumber}`, type: 'location', data: crime });
          nodeSet.add(crimeId);
        }
        links.push({ source: suspectNodeId, target: crimeId, label: link.role, weight: 1 });

        const crimeLinks = store.getLinksForCrime(crime.ROWID);
        for (const cl of crimeLinks) {
          if (cl.suspectId !== suspect.ROWID) {
            const assocId = `suspect-${cl.suspectId}`;
            if (!nodeSet.has(assocId)) {
              const assoc = store.getSuspect(cl.suspectId);
              if (assoc) {
                nodes.push({ id: assocId, label: assoc.name, type: 'suspect', data: assoc });
                nodeSet.add(assocId);
                links.push({ source: suspectNodeId, target: assocId, label: 'associate', weight: 0.5 });
              }
            }
          }
        }
      }
    }

    return { nodes, links };
  }
}
