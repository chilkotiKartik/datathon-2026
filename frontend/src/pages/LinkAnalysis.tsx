import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function LinkAnalysis() {
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [depth, setDepth] = useState(3);
  const [search, setSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState('all');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getLinks(depth).then(data => {
      if (data.nodes?.length > 0) setGraphData(data);
    });
  }, [depth]);

  const stats = useMemo(() => ({
    suspects: graphData?.nodes?.filter((n: any) => n.type === 'suspect').length || 0,
    crimes: graphData?.nodes?.filter((n: any) => n.type === 'crime' || n.type === 'victim').length || 0,
    locations: graphData?.nodes?.filter((n: any) => n.type === 'location').length || 0,
    vehicles: graphData?.nodes?.filter((n: any) => n.type === 'vehicle').length || 0,
  }), [graphData]);

  const linkTypeData = useMemo(() => {
    if (!graphData?.links) return [];
    const counts: Record<string, number> = {};
    graphData.links.forEach((l: any) => {
      const r = l.role || 'unknown';
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({ name: k, count: v }));
  }, [graphData]);

  const filteredNodes = useMemo(() => {
    if (!graphData?.nodes) return graphData?.nodes || [];
    if (!search) return graphData.nodes;
    const q = search.toLowerCase();
    return graphData.nodes.filter((n: any) =>
      n.label?.toLowerCase().includes(q) || n.type?.toLowerCase().includes(q)
    );
  }, [graphData, search]);

  const filteredLinks = useMemo(() => {
    if (!graphData?.links) return [];
    if (linkFilter === 'all') return graphData.links;
    return graphData.links.filter((l: any) => (l.role || 'unknown') === linkFilter);
  }, [graphData, linkFilter]);

  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const nodeColor = (type: string) => ({ suspect: '#ef4444', crime: '#8b5cf6', victim: '#3b82f6', location: '#22c55e', vehicle: '#9ca3af' }[type] || '#6b7280');
    const nodeRadius = (type: string) => ({ suspect: 12, crime: 10, victim: 8, location: 7, vehicle: 6 }[type] || 6);

    filteredNodes.forEach((n: any) => {
      const id = `glow-${n.id?.toString().replace(/\s+/g, '-')}`;
      const f = defs.append('filter').attr('id', id).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      f.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
      f.append('feMerge').append('feMergeNode').attr('in', 'blur');
      f.append('feMerge').append('feMergeNode').attr('in', 'SourceGraphic');
    });

    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredLinks).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    const link = svg.append('g').selectAll('line').data(filteredLinks).join('line')
      .attr('stroke', d => {
        if (d.role === 'primary') return '#ef444480';
        if (d.role === 'accomplice') return '#f59e0b80';
        return '#4b556380';
      })
      .attr('stroke-width', d => Math.max(1.5, (d.weight || 1) * 2))
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', d => d.role === 'associate' ? '4,4' : 'none');

    const node = svg.append('g').selectAll('circle').data(filteredNodes).join('circle')
      .attr('r', d => nodeRadius(d.type))
      .attr('fill', d => nodeColor(d.type))
      .attr('stroke', d => selectedNode?.id === d.id ? '#fff' : d.type === 'suspect' ? '#ef444440' : 'rgba(255,255,255,0.15)')
      .attr('stroke-width', d => selectedNode?.id === d.id ? 3 : 1.5)
      .style('cursor', 'pointer')
      .style('filter', d => selectedNode?.id === d.id ? `url(#glow-${d.id?.toString().replace(/\s+/g, '-')})` : 'none')
      .on('click', (_e: any, d: any) => setSelectedNode(d))
      .call(d3.drag<any, any>()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any);

    node.append('title').text((d: any) => d.label);
    const label = svg.append('g').selectAll('text').data(filteredNodes.filter((n: any) => n.type === 'suspect' || n.type === 'crime')).join('text')
      .text((d: any) => d.label.substring(0, 18)).attr('font-size', 10).attr('dx', 14).attr('dy', 4).attr('fill', '#e5e7eb')
      .attr('font-weight', d => d.type === 'suspect' ? '600' : '400');

    simulation.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y).attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    return () => { simulation.stop(); };
  }, [graphData, selectedNode, filteredNodes, filteredLinks]);

  return (
    <div className="page link-analysis-page">
      <header className="page-header">
        <h2>Criminological Network Analysis <span className="badge">Force Graph</span></h2>
        <div className="controls">
          <label>Depth:</label>
          <select value={depth} onChange={e => setDepth(Number(e.target.value))}>
            <option value={1}>1 Hop</option>
            <option value={2}>2 Hops</option>
            <option value={3}>3 Hops</option>
            <option value={5}>5 Hops</option>
          </select>
        </div>
      </header>

      <div className="legend-bar" style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span className="legend-item"><span className="dot" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} /> Suspects ({stats.suspects})</span>
        <span className="legend-item"><span className="dot" style={{ background: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }} /> Crimes ({stats.crimes})</span>
        <span className="legend-item"><span className="dot" style={{ background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} /> Victims</span>
        <span className="legend-item"><span className="dot" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} /> Locations ({stats.locations})</span>
        <span className="legend-item"><span className="dot" style={{ background: '#9ca3af' }} /> Vehicles ({stats.vehicles})</span>
        <input type="text" placeholder="Search nodes..." className="input"
          style={{ width: '150px', padding: '0.25rem 0.5rem', fontSize: '0.7rem', margin: 0 }}
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={linkFilter} onChange={e => setLinkFilter(e.target.value)}
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem' }}>
          <option value="all">All Links</option>
          <option value="primary">Primary</option>
          <option value="accomplice">Accomplice</option>
          <option value="associate">Associate</option>
        </select>
      </div>

      <div className="graph-container" ref={containerRef}>
        {!graphData ? (
          <div className="empty-state" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No link data. Seed suspects + links to visualize.
          </div>
        ) : (
          <>
            <div className="graph-stats">
              <span className="graph-stat"><span className="graph-stat-value">{filteredNodes.length}</span> <span className="graph-stat-label">Nodes</span></span>
              <span className="graph-stat"><span className="graph-stat-value">{filteredLinks.length}</span> <span className="graph-stat-label">Edges</span></span>
              <span className="graph-stat"><span className="graph-stat-value">{stats.suspects}</span> <span className="graph-stat-label">Suspects</span></span>
            </div>
            <svg ref={svgRef} width="100%" height="600" style={{ background: 'radial-gradient(ellipse at center, #1a1f35 0%, #0f172a 100%)' }} />
            {selectedNode && (
              <div className="node-detail">
                <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
                <h4>{selectedNode.label}</h4>
                <p>Type: <strong style={{ textTransform: 'capitalize', color: selectedNode.type === 'suspect' ? '#ef4444' : '#3b82f6' }}>{selectedNode.type}</strong></p>
                {selectedNode.data && <div className="node-data">
                  {selectedNode.data.category && <span>Category: {selectedNode.data.category}</span>}
                  {selectedNode.data.severity && <span>Severity: {selectedNode.data.severity}</span>}
                  {selectedNode.data.role && <span>Role: {selectedNode.data.role}</span>}
                  {selectedNode.data.crimeCount && <span>Crimes: {selectedNode.data.crimeCount}</span>}
                </div>}
              </div>
            )}
          </>
        )}
      </div>

      {linkTypeData.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-header"><h3>Link Type Breakdown</h3></div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              {linkTypeData.map((d, i) => (
                <div key={i} className="bar-row">
                  <span className="bar-label" style={{ textTransform: 'capitalize' }}>{d.name}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(d.count / Math.max(1, ...linkTypeData.map(x => x.count))) * 100}%`, background: ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6'][i % 4] }} /></div>
                  <span className="bar-value">{d.count}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width={200} height={100}>
              <BarChart data={linkTypeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 9 }} />
                <YAxis hide />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {linkTypeData.map((_, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6'][i % 4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
