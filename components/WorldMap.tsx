import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CountryData, MetricType } from '../types';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface WorldMapProps {
  data: CountryData[];
  selectedMetric: MetricType;
}

const WorldMap: React.FC<WorldMapProps> = ({ data, selectedMetric }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 500 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Store zoom behavior to access it from control buttons
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Resize observer
  useEffect(() => {
    const observeTarget = wrapperRef.current;
    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        // Avoid setting 0 height if invisible
        if (width > 0) {
           setDimensions({ width, height: width * 0.55 });
        }
      }
    });
    resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch World Data
  useEffect(() => {
    const fetchWorldData = async () => {
        try {
            const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
            if (!response.ok) throw new Error('Failed to load map');
            const topology = await response.json();
            setWorldData(topology);
        } catch (error) {
            console.error('Error fetching world data:', error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchWorldData();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    
    // Capture current zoom transform before clearing
    // This allows maintaining zoom level when changing metrics/resizing
    let previousTransform = d3.zoomIdentity;
    if (svg.node()) {
        previousTransform = d3.zoomTransform(svg.node()!);
    }

    svg.selectAll("*").remove(); // Clear previous renders

    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    // Use a Mercator projection
    const projection = d3.geoMercator()
      .scale(width / 6.5)
      .translate([width / 2, height / 1.5]);
    
    const pathGenerator = d3.geoPath().projection(projection);

    // Create a container group for content that will be zoomed/panned
    const contentGroup = svg.append("g");

    // Initialize Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8]) // Zoom levels: 1x to 8x
      .translateExtent([[0, 0], [width, height]]) // Prevent panning infinitely away
      .on("zoom", (event) => {
        contentGroup.attr("transform", event.transform);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);

    // Restore previous zoom state if applicable
    if (previousTransform.k !== 1 || previousTransform.x !== 0 || previousTransform.y !== 0) {
        svg.call(zoom.transform, previousTransform);
    }

    // Color scale for EIRI
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateRdYlGn);

    // Radius scale based on stations (log scale for better visibility of small vs large)
    const stationExtent = d3.extent(data, d => d.stations) as [number, number];
    const radiusScale = d3.scaleLog()
      .domain([1, stationExtent[1] || 100])
      .range([3, 15]);

    // Draw a background "ocean"
    contentGroup.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f8fafc");

    // Draw Land Masses (if loaded)
    if (worldData) {
        const countries = topojson.feature(worldData, worldData.objects.countries);
        contentGroup.append("g")
            .selectAll("path")
            .data((countries as any).features)
            .enter()
            .append("path")
            .attr("d", pathGenerator as any)
            .attr("fill", "#e2e8f0")
            .attr("stroke", "#cbd5e1")
            .attr("stroke-width", 0.5);
    }

    // Draw grid lines (graticule)
    const graticule = d3.geoGraticule();
    contentGroup.append("path")
      .datum(graticule)
      .attr("d", pathGenerator)
      .attr("fill", "none")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.5);

    // Filter valid coordinates and sort data (larger circles behind)
    const validData = data.filter(d => d.lat != null && d.lng != null && !isNaN(d.lat) && !isNaN(d.lng));
    const sortedData = [...validData].sort((a, b) => b.stations - a.stations);

    // Tooltip reference (outside zoom group, appended to wrapper)
    const tooltip = d3.select(wrapperRef.current).select(".tooltip");
    // Remove existing tooltip if any (to prevent duplicates on re-render)
    if (!tooltip.empty()) tooltip.remove();
    
    const newTooltip = d3.select(wrapperRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(15, 23, 42, 0.95)")
      .style("color", "#fff")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "10")
      .style("box-shadow", "0 10px 15px -3px rgba(0, 0, 0, 0.2)");

    // Create groups for circles and labels inside contentGroup
    const groups = contentGroup.selectAll("g.country-group")
      .data(sortedData)
      .enter()
      .append("g")
      .attr("class", "country-group")
      .attr("transform", d => {
         const coords = projection([d.lng!, d.lat!]);
         return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
      })
      .style("cursor", "pointer");

    // Append Circles
    groups.append("circle")
      .attr("r", d => {
         return selectedMetric === 'stations' ? radiusScale(d.stations) : 6;
      })
      .attr("fill", d => {
        if (selectedMetric === 'gap_value') {
            return d.gap_value > 0 ? '#3b82f6' : '#f97316';
        }
        return colorScale(d.EIRI);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    // Append Text Labels
    groups.append("text")
      .text(d => d.country_name || d.country_code)
      .attr("y", d => {
          const r = selectedMetric === 'stations' ? radiusScale(d.stations) : 6;
          return -r - 4; // Position above circle
      })
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "#1e293b")
      .style("pointer-events", "none")
      .style("text-shadow", "0px 1px 2px rgba(255,255,255,0.8)")
      .style("opacity", 0) // Initially hidden
      .style("transition", "opacity 0.2s ease");

    // Interaction
    groups.on("mouseover", function(event, d) {
        // Highlight Circle
        d3.select(this).select("circle")
          .attr("stroke", "#0f172a")
          .attr("stroke-width", 2)
          .attr("opacity", 1);
        
        // Show Label
        d3.select(this).select("text")
          .style("opacity", 1);

        // Bring to front
        d3.select(this).raise();
        
        // Flag URL
        const flagUrl = `https://flagcdn.com/w40/${d.country_code.toLowerCase()}.png`;

        // Tooltip Content with Flag and Selected Metric Highlight
        newTooltip.style("visibility", "visible")
          .html(`
            <div class="flex items-center gap-3 mb-2 pb-2 border-b border-slate-700">
                <img src="${flagUrl}" alt="${d.country_code}" class="w-8 h-auto shadow-sm rounded-sm" />
                <div class="font-bold text-sm text-slate-100">${d.country_name || d.country_code}</div>
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span class="${selectedMetric === 'stations' ? 'text-blue-400 font-semibold' : 'text-slate-400'}">Stations:</span>
                <span class="text-right font-mono text-slate-200 ${selectedMetric === 'stations' ? 'font-bold' : ''}">${d.stations.toLocaleString()}</span>
                
                <span class="${selectedMetric === 'EIRI' ? 'text-blue-400 font-semibold' : 'text-slate-400'}">Readiness:</span>
                <span class="text-right font-mono text-slate-200 ${selectedMetric === 'EIRI' ? 'font-bold' : ''}">${d.EIRI.toFixed(1)}</span>
                
                <span class="${selectedMetric === 'gap_value' ? 'text-blue-400 font-semibold' : 'text-slate-400'}">Gap:</span>
                <span class="text-right font-mono text-slate-200 ${selectedMetric === 'gap_value' ? 'font-bold' : ''}">${d.gap_value.toFixed(1)}</span>
            </div>
          `);
      })
      .on("mousemove", (event) => {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        // Adjust tooltip position to not cover the cursor
        newTooltip
          .style("top", (y - 100) + "px") // Move up higher so it doesn't cover label
          .style("left", (x - 75) + "px"); // Center horizontally relative to cursor
      })
      .on("mouseout", function(event) {
        d3.select(this).select("circle")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("opacity", 0.8);

        d3.select(this).select("text")
          .style("opacity", 0);
          
        newTooltip.style("visibility", "hidden");
      });

    // Add legend for Color Scale (if EIRI)
    // IMPORTANT: Legend should stay static, so append to SVG directly, NOT contentGroup
    if (selectedMetric === 'EIRI') {
        const legendWidth = 200;
        const legendHeight = 10;
        
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");
        
        linearGradient.selectAll("stop")
            .data([
                {offset: "0%", color: d3.interpolateRdYlGn(0)},
                {offset: "50%", color: d3.interpolateRdYlGn(0.5)},
                {offset: "100%", color: d3.interpolateRdYlGn(1)}
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
        
        const legendGroup = svg.append("g")
             .attr("class", "legend")
             .attr("transform", `translate(20, ${height - 30})`);
             
        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#linear-gradient)");

        legendGroup.append("text")
            .attr("x", 0)
            .attr("y", -5)
            .text("Readiness Index (0-100)")
            .style("font-size", "10px")
            .style("fill", "#64748b");
    }

  }, [data, dimensions, selectedMetric, worldData]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current)
            .transition()
            .duration(300)
            .call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current)
            .transition()
            .duration(300)
            .call(zoomRef.current.scaleBy, 1 / 1.3);
    }
  };

  const handleResetZoom = () => {
      if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current)
              .transition()
              .duration(500)
              .call(zoomRef.current.transform, d3.zoomIdentity);
      }
  }

  return (
    <div ref={wrapperRef} className="relative w-full shadow-lg rounded-xl overflow-hidden bg-white border border-slate-200">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-lg font-bold text-slate-800">Global EV Landscape</h3>
        <p className="text-xs text-slate-500">Metric: {selectedMetric === 'EIRI' ? 'Infrastructure Readiness (Color)' : selectedMetric === 'gap_value' ? 'Gap (Blue=Demand, Orange=Infra)' : 'Station Volume (Size)'}</p>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Zoom In"
        >
          <Plus size={20} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Zoom Out"
        >
          <Minus size={20} />
        </button>
        <button 
          onClick={handleResetZoom}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Reset View"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
      )}
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block w-full cursor-move" />
    </div>
  );
};

export default WorldMap;