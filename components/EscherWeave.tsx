
import React, { useState, useMemo, useEffect, useRef } from 'react';
import PlayingCard from './PlayingCard';
import { Suit, CARD_WIDTH, CARD_HEIGHT, getTarotDeck } from '../constants';
import { 
  MoveHorizontal, 
  MoveVertical, 
  Eye, 
  EyeOff,
  Shuffle, 
  Minimize2, 
  Maximize2, 
  RotateCcw,
  RotateCw,
  GripHorizontal,
  LayoutGrid,
  X,
  Layers,
  ScanFace,
  Triangle,
  Square,
  Thermometer,
  Gamepad2,
  Dices,
  Bug,
} from 'lucide-react';

interface CardData {
  id: string;
  c: number;
  r: number;
  x: number;
  y: number;
  zIndex: number;
  suit: Suit;
  rank: string;
  imageUrl: string;
  type: 'PEAK' | 'VALLEY' | 'SLOPE' | 'HUB';
  patchType?: 'CROSS' | 'TWIST';
  label?: string;
  isPatch?: boolean;
  originalCardId?: string; // For patches to know their parent
}

// We grab the deck from constants now
const TAROT_DECK = getTarotDeck();

const shuffleArray = <T,>(array: T[], seed: number): T[] => {
  const newArr = [...array];
  let currentState = seed;
  const nextRandom = () => {
      currentState = (currentState * 1664525 + 1013904223) % 4294967296;
      return currentState / 4294967296;
  };
  
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(nextRandom()) * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const EscherWeave: React.FC = () => {
  // Configuration State
  const [spacingX, setSpacingX] = useState(100);
  const [spacingY, setSpacingY] = useState(170);
  const [gridSize, setGridSize] = useState(3);
  const [cardScale, setCardScale] = useState(1);
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.random());
  const [showHelpers, setShowHelpers] = useState(false);
  const [spin, setSpin] = useState(true); // true = Clockwise, false = Counter-Clockwise
  
  const [triangleTilt, setTriangleTilt] = useState(0); // -1 to 1
  const [enableTriangleTilt, setEnableTriangleTilt] = useState(true);
  const [tiltAxis, setTiltAxis] = useState<'Y' | 'X'>('Y');
  const [linkTiltSpacing, setLinkTiltSpacing] = useState(true);
  
  const [squareTilt, setSquareTilt] = useState(0); // -4 to 4
  const [enableSquareTilt, setEnableSquareTilt] = useState(true); // Default to true
  
  // Card Override State for Single Shuffle
  const [cardOverrides, setCardOverrides] = useState<Map<string, number>>(new Map());

  // Heatmap State
  const [hoveredNode, setHoveredNode] = useState<{ id: string, sector: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ id: string, sector: number } | null>(null);
  
  // Game State
  const [gameActiveNode, setGameActiveNode] = useState<{ id: string, sector: number } | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Map<nodeId, steps> where nodeId is `${logicalId}_${sector}`
  const [stepMap, setStepMap] = useState<Map<string, number>>(new Map());
  // Visualization of Shortest Path Tree
  const [treeEdges, setTreeEdges] = useState<Array<{x1:number,y1:number,x2:number,y2:number, dist: number}>>([]);

  // Debug State
  const [showDeckDebug, setShowDeckDebug] = useState(false);
  
  // Camera State
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isStageDragging, setIsStageDragging] = useState(false);
  const stageDragStart = useRef({ x: 0, y: 0 });
  const hasPanMoved = useRef(false);

  // Interaction State
  const [interactionMode, setInteractionMode] = useState<'FLIP' | 'HIDE' | 'HEATMAP' | 'GAME' | 'SHUFFLE'>('FLIP');
  // Set of IDs for cards that are currently face down
  const [faceDownCards, setFaceDownCards] = useState<Set<string>>(new Set());
  // Set of IDs for cards that are hidden
  const [hiddenCards, setHiddenCards] = useState<Set<string>>(new Set());
  
  // UI State
  const [menuPos, setMenuPos] = useState({ x: 24, y: 24 });
  const [isMenuMinimized, setIsMenuMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Menu Drag Logic
  const handleMenuMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragOffset.current = {
        x: e.clientX - menuPos.x,
        y: e.clientY - menuPos.y
    };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          setMenuPos({
              x: e.clientX - dragOffset.current.x,
              y: e.clientY - dragOffset.current.y
          });
      };
      const handleMouseUp = () => setIsDragging(false);

      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging]);

  // Stage Pan Logic
  const handleStageMouseDown = (e: React.MouseEvent) => {
      // Only left mouse button
      if (e.button !== 0) return;
      
      setIsStageDragging(true);
      hasPanMoved.current = false;
      stageDragStart.current = { 
          x: e.clientX - view.x, 
          y: e.clientY - view.y 
      };
  };

  const handleStageWheel = (e: React.WheelEvent) => {
      const zoomSpeed = 0.001;
      const newZoom = Math.max(0.1, Math.min(5, view.zoom - e.deltaY * zoomSpeed));
      setView(v => ({ ...v, zoom: newZoom }));
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isStageDragging) {
              const newX = e.clientX - stageDragStart.current.x;
              const newY = e.clientY - stageDragStart.current.y;
              
              // If moved significantly, flag as a pan gesture to prevent clicks
              if (!hasPanMoved.current && (Math.abs(newX - view.x) > 3 || Math.abs(newY - view.y) > 3)) {
                  hasPanMoved.current = true;
              }

              setView(v => ({ ...v, x: newX, y: newY }));
          }
      };
      
      const handleMouseUp = () => {
          setIsStageDragging(false);
      };

      if (isStageDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isStageDragging, view.x, view.y]);

  const handleReset = () => {
    setSpacingX(100);
    setSpacingY(170);
    setGridSize(3);
    setCardScale(1);
    setShuffleSeed(Math.random());
    setFaceDownCards(new Set()); 
    setHiddenCards(new Set()); 
    setCardOverrides(new Map());
    setInteractionMode('FLIP');
    setSpin(true);
    setTriangleTilt(0);
    setEnableTriangleTilt(true);
    setTiltAxis('Y');
    setLinkTiltSpacing(true);
    setSquareTilt(0);
    setEnableSquareTilt(true);
    setStepMap(new Map());
    setTreeEdges([]);
    setHoveredNode(null);
    setSelectedNode(null);
    setGameActiveNode(null);
    setIsGameStarted(false);
    setView({ x: 0, y: 0, zoom: 1 }); // Reset Camera
  };

  // ----------------------------------------------------------
  // CARD GENERATION LOGIC
  // ----------------------------------------------------------
  const { cards, patches } = useMemo(() => {
    const generatedCards: CardData[] = [];
    const generatedPatches: CardData[] = [];
    
    // Initial deck shuffle
    const shuffledDeck = shuffleArray(TAROT_DECK, shuffleSeed);

    const getStableIndex = (c: number, r: number) => {
        const k = Math.max(c, r);
        if (r === k) {
            return k * k + c;
        } else {
            return k * k + k + (k - r);
        }
    };

    const effectiveTriangleTilt = enableTriangleTilt ? triangleTilt : 0;
    const tiltFactor = effectiveTriangleTilt;
    const absTilt = Math.abs(effectiveTriangleTilt);
    let currentSpacingX = spacingX;
    let currentSpacingY = spacingY;

    if (linkTiltSpacing) {
        const targetX = 220;
        const targetY = 360;
        currentSpacingX = spacingX + (targetX - spacingX) * absTilt;
        currentSpacingY = spacingY + (targetY - spacingY) * absTilt;
    }

    const SX = currentSpacingX * cardScale;
    const SY = currentSpacingY * cardScale;

    const getKeyframe = (p: number) => {
        const idx = Math.floor(p / 100) % 8;
        switch(idx) {
            case 0: return { u: {x:1, y:1}, v: {x:-1, y:1} };
            case 1: return { u: {x:2, y:0}, v: {x:0, y:2} };
            case 2: return { u: {x:1, y:-1}, v: {x:1, y:1} };
            case 3: return { u: {x:0, y:-2}, v: {x:2, y:0} };
            case 4: return { u: {x:-1, y:-1}, v: {x:1, y:-1} };
            case 5: return { u: {x:-2, y:0}, v: {x:0, y:-2} };
            case 6: return { u: {x:-1, y:1}, v: {x:-1, y:-1} };
            case 7: return { u: {x:0, y:2}, v: {x:-2, y:0} };
            default: return { u: {x:1, y:1}, v: {x:-1, y:1} };
        }
    };

    let uVec = { x: 1, y: 1 };
    let vVec = { x: -1, y: 1 };

    if (enableSquareTilt) {
        const phase = (squareTilt * 100); 
        const normalizedPhase = ((phase % 800) + 800) % 800; // 0 to 800
        const t = (normalizedPhase % 100) / 100;
        
        const frameA = getKeyframe(normalizedPhase);
        const frameB = getKeyframe(normalizedPhase + 100);

        uVec = {
            x: frameA.u.x * (1 - t) + frameB.u.x * t,
            y: frameA.u.y * (1 - t) + frameB.u.y * t
        };
        vVec = {
            x: frameA.v.x * (1 - t) + frameB.v.x * t,
            y: frameA.v.y * (1 - t) + frameB.v.y * t
        };
    }

    const centerIndex = (gridSize - 1) / 2;

    for (let c = 0; c < gridSize; c++) {
      for (let r = 0; r < gridSize; r++) {
        const i = c - centerIndex;
        const j = r - centerIndex;

        let x = (i * uVec.x * SX) + (j * vVec.x * SX);
        let y = (i * uVec.y * SY) + (j * vVec.y * SY);

        if (effectiveTriangleTilt !== 0) {
            let geomFactor = 0;
            let spacing = SY;
            
            if (tiltAxis === 'Y') {
                spacing = SY;
                if (effectiveTriangleTilt > 0) {
                    geomFactor = Math.min(c, r);
                } else {
                    geomFactor = (gridSize - 1) - Math.max(c, r);
                }
            } else {
                spacing = SX; 
                if (effectiveTriangleTilt > 0) {
                     geomFactor = -Math.min(r, (gridSize - 1) - c);
                } else {
                     geomFactor = -Math.min((gridSize - 1) - r, c);
                }
            }

            const shiftAmount = geomFactor * spacing * tiltFactor;
            const tiltVec = tiltAxis === 'Y' 
                ? { x: (uVec.x + vVec.x) * 0.5, y: (uVec.y + vVec.y) * 0.5 }
                : { x: (uVec.x - vVec.x) * 0.5, y: (uVec.y - vVec.y) * 0.5 };

            x -= tiltVec.x * shiftAmount;
            y -= tiltVec.y * shiftAmount;

            const centerSign = tiltAxis === 'X' ? -1 : 1;
            const centerShift = (gridSize - 1) * spacing * 0.5 * tiltFactor * centerSign;
            
            x += tiltVec.x * centerShift;
            y += tiltVec.y * centerShift;
        }

        const id = `card-${c}-${r}`;

        // Determine card data (with overrides)
        let cardData;
        if (cardOverrides.has(id)) {
            cardData = TAROT_DECK[cardOverrides.get(id)!];
        } else {
            const stableIndex = getStableIndex(c, r);
            cardData = shuffledDeck[stableIndex % shuffledDeck.length];
        }

        const sum = c + r;
        const isEvenSum = sum % 2 === 0;
        const isRowOdd = r % 2 !== 0;
        const isColOdd = c % 2 !== 0;

        let zIndex = 0;
        let type: CardData['type'] = 'SLOPE';
        let needsPatch = false;

        if (isEvenSum) {
            if (isColOdd && isRowOdd) {
                type = 'HUB';
                zIndex = 0;
                needsPatch = true;
            } else {
                type = 'SLOPE';
                zIndex = 200;
            }
        } else {
            let effectiveSpin = spin;
            if (Math.abs(squareTilt) === 2) {
                effectiveSpin = !effectiveSpin;
            }

            const isPeak = effectiveSpin ? isRowOdd : isColOdd;
            
            if (isPeak) {
                type = 'PEAK';
                zIndex = 300;
            } else {
                type = 'VALLEY';
                zIndex = 100;
            }
        }

        generatedCards.push({
          id, c, r, x, y, zIndex,
          suit: cardData.suit, rank: cardData.rank, imageUrl: cardData.imageUrl,
          type,
          label: `${c},${r}`
        });

        if (needsPatch) {
             const isTip = (c === gridSize - 1) && (r === gridSize - 1);
             const patchType = isTip ? 'TWIST' : 'CROSS';

             generatedPatches.push({
                id: `patch-${c}-${r}`,
                c, r, x, y,
                zIndex: 500,
                suit: cardData.suit, rank: cardData.rank, imageUrl: cardData.imageUrl,
                type: 'HUB', patchType, isPatch: true,
                originalCardId: id
             });
        }
      }
    }
    return { cards: generatedCards, patches: generatedPatches };
  }, [spacingX, spacingY, gridSize, shuffleSeed, cardScale, spin, triangleTilt, enableTriangleTilt, tiltAxis, linkTiltSpacing, squareTilt, enableSquareTilt, cardOverrides]);

  // ----------------------------------------------------------
  // GRAPH LOGIC
  // ----------------------------------------------------------
  const graphData = useMemo(() => {
      const patchMap = new Map<string, CardData>();
      patches.forEach(p => {
          if (p.originalCardId) patchMap.set(p.originalCardId, p);
      });

      const getQuadRect = (c: CardData, sector: number) => {
          const w = CARD_WIDTH * cardScale;
          const h = CARD_HEIGHT * cardScale;
          const cx = c.x; 
          const cy = c.y;
          
          const isRight = (sector === 1 || sector === 3);
          const isBottom = (sector === 2 || sector === 3);
          
          const x1 = isRight ? cx : cx - w/2;
          const x2 = isRight ? cx + w/2 : cx;
          const y1 = isBottom ? cy : cy - h/2;
          const y2 = isBottom ? cy + h/2 : cy;
          
          return { x1, y1, x2, y2, cx: (x1+x2)/2, cy: (y1+y2)/2 };
      };

      const getEffectiveZ = (c: CardData, sector: number) => {
          const patch = patchMap.get(c.id);
          if (patch) {
              let covered = false;
              if (patch.patchType === 'TWIST') {
                  covered = spin ? (sector === 0) : (sector === 1);
              } else if (patch.patchType === 'CROSS') {
                  covered = spin ? (sector === 0 || sector === 3) : (sector === 1 || sector === 2);
              }
              if (covered) return patch.zIndex;
          }
          return c.zIndex;
      };

      const checkOverlap = (r1: {x1:number,y1:number,x2:number,y2:number}, r2: {x1:number,y1:number,x2:number,y2:number}) => {
          const eps = 2; 
          return (r1.x1 + eps < r2.x2 - eps) && (r1.x2 - eps > r2.x1 + eps) && 
                 (r1.y1 + eps < r2.y2 - eps) && (r1.y2 - eps > r2.y1 + eps);
      };

      // Build "World" of all quadrants
      const allQuads: Array<{id: string, s: number, z: number, rect: any}> = [];
      
      cards.forEach(card => {
          for (let s = 0; s < 4; s++) {
              allQuads.push({
                  id: card.id,
                  s: s,
                  z: getEffectiveZ(card, s),
                  rect: getQuadRect(card, s)
              });
          }
      });

      const isCovered = (target: {id: string, z: number, rect: any}) => {
          return allQuads.some(other => 
              other.id !== target.id && 
              other.z > target.z && 
              checkOverlap(target.rect, other.rect)
          );
      };

      const coverageMap = new Map<string, boolean>();
      allQuads.forEach(q => {
          coverageMap.set(`${q.id}_${q.s}`, isCovered(q));
      });

      const adj = new Map<string, { id: string, weight: number, node: {id: string, s: number} }[]>();
      const getNodeKey = (id: string, s: number) => `${id}_${s}`;
      const quadMap = new Map<string, {id: string, s: number, z: number, rect: any}>();

      allQuads.forEach(qA => {
          const nodeA = getNodeKey(qA.id, qA.s);
          quadMap.set(nodeA, qA);
          
          // Internal edges
          const neighbors = [];
          if (qA.s === 0) neighbors.push(1, 2);
          if (qA.s === 1) neighbors.push(0, 3);
          if (qA.s === 2) neighbors.push(0, 3);
          if (qA.s === 3) neighbors.push(1, 2);

          neighbors.forEach(sB => {
              const nodeB = getNodeKey(qA.id, sB);
              if (!adj.has(nodeA)) adj.set(nodeA, []);
              adj.get(nodeA)!.push({ 
                  id: nodeB, 
                  weight: 0, // Internal move cost 0
                  node: {id: qA.id, s: sB} 
              });
          });

          // External (Jump) Edges - "Step Down"
          allQuads.forEach(qB => {
              if (qA.id === qB.id) return;
              
              if (checkOverlap(qA.rect, qB.rect)) {
                  // Rule: Can only step DOWN to a card B that is BELOW card A.
                  if (qA.z > qB.z) {
                      const nodeB = getNodeKey(qB.id, qB.s);
                      if (!adj.has(nodeA)) adj.set(nodeA, []);
                      adj.get(nodeA)!.push({ 
                          id: nodeB, 
                          weight: 1, 
                          node: {id: qB.id, s: qB.s} 
                      });
                  }
              }
          });
      });

      return { adj, quadMap, getNodeKey };
  }, [cards, patches, cardScale, spin]);

  // ----------------------------------------------------------
  // HEATMAP & PATHFINDING (Shared by Heatmap & Game)
  // ----------------------------------------------------------
  useEffect(() => {
      const isGame = interactionMode === 'GAME';
      const isHeatmap = interactionMode === 'HEATMAP';

      if (!isGame && !isHeatmap) {
          setStepMap(new Map());
          setTreeEdges([]);
          return;
      }

      // Define source nodes (Distance 0)
      const sourceKeys: string[] = [];

      if (isGame) {
          if (gameActiveNode) {
              // In game mode, the whole active card is the "source". 
              // All its sectors are distance 0.
              sourceKeys.push(graphData.getNodeKey(gameActiveNode.id, 0));
              sourceKeys.push(graphData.getNodeKey(gameActiveNode.id, 1));
              sourceKeys.push(graphData.getNodeKey(gameActiveNode.id, 2));
              sourceKeys.push(graphData.getNodeKey(gameActiveNode.id, 3));
          } else {
              // Game started but no node selected yet
              setStepMap(new Map());
              setTreeEdges([]);
              return;
          }
      } else if (isHeatmap) {
          const sourceNode = selectedNode || hoveredNode;
          if (sourceNode) {
              sourceKeys.push(graphData.getNodeKey(sourceNode.id, sourceNode.sector));
          } else {
              setStepMap(new Map());
              setTreeEdges([]);
              return;
          }
      }

      const { adj } = graphData;
      const dists = new Map<string, number>();
      const predecessors = new Map<string, string>();
      
      const deque: string[] = [];

      // Initialize Multi-Source BFS
      sourceKeys.forEach(key => {
          dists.set(key, 0);
          deque.push(key);
      });

      while (deque.length > 0) {
          const u = deque.shift()!;
          const d = dists.get(u)!;

          const neighbors = adj.get(u) || [];
          for (const edge of neighbors) {
              // Cannot traverse hidden cards
              if (hiddenCards.has(edge.node.id)) continue;

              const newDist = d + edge.weight;
              if (!dists.has(edge.id) || newDist < dists.get(edge.id)!) {
                  dists.set(edge.id, newDist);
                  predecessors.set(edge.id, u);
                  if (edge.weight === 0) {
                      deque.unshift(edge.id);
                  } else {
                      deque.push(edge.id);
                  }
              }
          }
      }

      setStepMap(dists);

      // Build Tree Visualization (Only for Heatmap usually, but safe to calc)
      const newEdges: Array<{x1:number,y1:number,x2:number,y2:number, dist: number}> = [];
      
      const getQuadCenter = (idStr: string) => {
          const q = graphData.quadMap.get(idStr);
          if (!q) return null;
          const x = (q.s === 1 || q.s === 3) ? q.rect.cx + (q.rect.x2-q.rect.x1)*0.25 : q.rect.cx - (q.rect.x2-q.rect.x1)*0.25;
          const y = (q.s === 2 || q.s === 3) ? q.rect.cy + (q.rect.y2-q.rect.y1)*0.25 : q.rect.cy - (q.rect.y2-q.rect.y1)*0.25;
          return { x, y };
      };

      predecessors.forEach((parentId, childId) => {
          const p = getQuadCenter(parentId);
          const c = getQuadCenter(childId);
          const dist = dists.get(childId) || 0;
          if (p && c) {
              newEdges.push({ x1: p.x, y1: p.y, x2: c.x, y2: c.y, dist });
          }
      });

      setTreeEdges(newEdges);
      
  }, [interactionMode, hoveredNode, selectedNode, gameActiveNode, graphData, hiddenCards]);


  // ----------------------------------------------------------
  // INTERACTION HANDLERS
  // ----------------------------------------------------------
  const toggleFlip = (id: string) => {
      setFaceDownCards(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleCardClick = (card: CardData, sector: number) => {
      if (hasPanMoved.current) return; 

      const id = card.originalCardId || card.id;

      if (interactionMode === 'HEATMAP') {
          if (hoveredNode && hoveredNode.id === id) {
              setSelectedNode(hoveredNode);
          }
          return;
      }

      if (interactionMode === 'SHUFFLE') {
          // Find cards not currently displayed
          const currentSignatures = new Set(cards.map(c => `${c.rank}:${c.suit}`));
          const candidates: number[] = [];
          TAROT_DECK.forEach((c, i) => {
              if (!currentSignatures.has(`${c.rank}:${c.suit}`)) {
                  candidates.push(i);
              }
          });

          if (candidates.length > 0) {
              const pick = candidates[Math.floor(Math.random() * candidates.length)];
              setCardOverrides(prev => {
                  const next = new Map(prev);
                  next.set(id, pick);
                  return next;
              });
          }
          return;
      }
      
      if (interactionMode === 'GAME') {
          if (!isGameStarted || !gameActiveNode) {
              // Start game: any card is valid start
              setGameActiveNode({ id, sector });
              setIsGameStarted(true);
              toggleFlip(id);
          } else {
              // Check validity using StepMap (calculated from previous ActiveNode)
              const targetKey = graphData.getNodeKey(id, sector);
              const dist = stepMap.get(targetKey);

              // Strictly enforce step distance of 1
              // Dist 0 = current card (internal). Dist > 1 = invalid jump.
              if (dist === 1) {
                  setGameActiveNode({ id, sector });
                  toggleFlip(id);
              }
          }
          return;
      }
      
      if (interactionMode === 'FLIP') {
          toggleFlip(id);
      } else if (interactionMode === 'HIDE') {
          setHiddenCards(prev => {
              const next = new Set(prev);
              next.add(id);
              return next;
          });
      }
  };

  const handleFlipAll = () => {
      const allVisibleIds = cards
        .filter(c => !hiddenCards.has(c.id))
        .map(c => c.id);
      
      if (allVisibleIds.length === 0) return;

      const allDown = allVisibleIds.every(id => faceDownCards.has(id));
      
      setFaceDownCards(prev => {
          const next = new Set(prev);
          if (allDown) {
              allVisibleIds.forEach(id => next.delete(id));
          } else {
              allVisibleIds.forEach(id => next.add(id));
          }
          return next;
      });
  };

  // --- RENDER HELPERS ---

  const getStyle = (card: CardData): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -CARD_WIDTH / 2,
    marginTop: -CARD_HEIGHT / 2,
    transform: `translate3d(${card.x}px, ${card.y}px, 0) scale(${cardScale})`,
    zIndex: card.zIndex,
    transition: isStageDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
  });

  const getPatchClipPath = (patchType?: 'CROSS' | 'TWIST') => {
      if (spin) {
          if (patchType === 'TWIST') {
              return 'polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)';
          }
          return 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 50% 100%, 50% 50%, 0% 50%)';
      } else {
          if (patchType === 'TWIST') {
              return 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)';
          }
          return 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%, 50% 100%, 0% 100%, 0% 50%, 50% 50%)';
      }
  };

  const renderCardWithOverlay = (card: CardData) => {
      const logicalId = card.originalCardId || card.id;
      if (hiddenCards.has(logicalId)) return null;

      const isFaceUp = !faceDownCards.has(logicalId);

      const style = getStyle(card);
      if (card.isPatch) {
          style.clipPath = getPatchClipPath(card.patchType);
      }

      // Determine overlays based on mode
      let overlayChildren = null;
      let cornerLabels = {};
      const sectors = [0, 1, 2, 3];

      // HEATMAP RENDER
      if (interactionMode === 'HEATMAP') {
          const corners = { tl: undefined, tr: undefined, bl: undefined, br: undefined };
          const overlays = sectors.map(s => {
              const dist = stepMap.get(`${logicalId}_${s}`);
              if (dist === undefined) return null;
              const opacity = Math.max(0, 0.7 - (dist * 0.1));
              
              if (s === 0) (corners as any).tl = dist;
              if (s === 1) (corners as any).tr = dist;
              if (s === 2) (corners as any).bl = dist;
              if (s === 3) (corners as any).br = dist;

              const clip = s === 0 ? 'inset(0 50% 50% 0)' :
                           s === 1 ? 'inset(0 0 50% 50%)' :
                           s === 2 ? 'inset(50% 50% 0 0)' :
                                     'inset(50% 0 0 50%)';
              
              return (
                  <div 
                    key={s} 
                    className="absolute inset-0 bg-pink-500 pointer-events-none transition-opacity duration-300"
                    style={{ opacity, clipPath: clip }}
                  />
              );
          });
          overlayChildren = <>{overlays}</>;
          cornerLabels = corners;
      }

      // GAME MODE RENDER
      if (interactionMode === 'GAME') {
          const overlays = sectors.map(s => {
              // Dist checks
              const dist = stepMap.get(`${logicalId}_${s}`);
              const isCurrent = (dist === 0 && gameActiveNode); // dist 0 means part of active card
              const isNeighbor = (dist === 1);

              if (!isCurrent && !isNeighbor) return null;

              const clip = s === 0 ? 'inset(0 50% 50% 0)' :
                           s === 1 ? 'inset(0 0 50% 50%)' :
                           s === 2 ? 'inset(50% 50% 0 0)' :
                                     'inset(50% 0 0 50%)';

              return (
                  <div 
                    key={s} 
                    className={`absolute inset-0 pointer-events-none transition-all duration-200 ${isCurrent ? 'bg-cyan-500/40 ring-4 ring-cyan-400 ring-inset' : 'bg-emerald-500/20 cursor-pointer'}`}
                    style={{ clipPath: clip }}
                  >
                    {isCurrent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-cyan-200 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)] animate-pulse" />
                        </div>
                    )}
                  </div>
              );
          });
          overlayChildren = <>{overlays}</>;
      }

      return (
          <PlayingCard
            key={card.id}
            suit={card.suit}
            rank={card.rank}
            imageUrl={card.imageUrl}
            style={style}
            isFaceUp={isFaceUp}
            onClick={() => {
                 const s = (hoveredNode?.id === logicalId) ? hoveredNode.sector : 0;
                 handleCardClick(card, s);
            }}
            onMouseMove={(e, s) => {
                if (interactionMode === 'HEATMAP' || interactionMode === 'GAME' || interactionMode === 'SHUFFLE') {
                    setHoveredNode({ id: logicalId, sector: s });
                }
            }}
            cornerLabels={cornerLabels}
            showAllCorners={interactionMode === 'HEATMAP'}
          >
            {overlayChildren}
            {showHelpers && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <span className="bg-black/70 text-white text-[10px] px-1 rounded">
                        {card.label} {card.type}
                    </span>
                </div>
            )}
          </PlayingCard>
      );
  };

  const renderDeckDebugger = () => {
      const groups = [
          { title: 'Major Arcana', suit: Suit.MAJOR },
          { title: 'Wands', suit: Suit.WANDS },
          { title: 'Cups', suit: Suit.CUPS },
          { title: 'Swords', suit: Suit.SWORDS },
          { title: 'Pentacles', suit: Suit.PENTACLES },
      ];

      return (
          <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-lg overflow-y-auto p-8 animate-in fade-in duration-200">
              <div className="max-w-7xl mx-auto">
                  <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-950/95 py-4 z-50 border-b border-slate-800">
                      <div>
                        <h2 className="text-3xl font-playfair text-white">Deck Inspector</h2>
                        <p className="text-slate-400 text-sm mt-1">Troubleshoot missing images by checking the full deck.</p>
                      </div>
                      <button 
                        onClick={() => setShowDeckDebug(false)}
                        className="p-2 bg-slate-800 hover:bg-red-900 text-white rounded-full transition-colors"
                      >
                          <X size={24} />
                      </button>
                  </div>

                  <div className="space-y-12 pb-12">
                      {groups.map(group => (
                          <div key={group.suit}>
                              <h3 className="text-xl font-bold text-amber-400 mb-4 border-l-4 border-amber-500 pl-3">{group.title}</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                                  {TAROT_DECK.filter(c => c.suit === group.suit).map(card => (
                                      <div key={card.label} className="flex flex-col items-center gap-2">
                                          <div className="relative w-[120px] h-[200px]">
                                              <PlayingCard
                                                  suit={card.suit}
                                                  rank={card.rank}
                                                  imageUrl={card.imageUrl}
                                                  isFaceUp={true}
                                                  style={{ width: '100%', height: '100%' }}
                                              />
                                          </div>
                                          <span className="text-xs text-slate-500 font-mono text-center max-w-[120px]">{card.label}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div 
        className="relative w-full h-full overflow-hidden"
        onMouseDown={handleStageMouseDown}
        onWheel={handleStageWheel}
    >
      {/* DEBUG OVERLAY */}
      {showDeckDebug && renderDeckDebugger()}

      {/* MAIN STAGE CAMERA WRAPPER */}
      <div 
        className="absolute inset-0 flex items-center justify-center will-change-transform origin-center"
        style={{ 
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transition: isStageDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {cards.map(card => renderCardWithOverlay(card))}
        {patches.map(patch => renderCardWithOverlay(patch))}
        
        {/* SNAKE LINE OVERLAY (SHORTEST PATH TREE) */}
        {interactionMode === 'HEATMAP' && selectedNode && treeEdges.length > 0 && (
             <svg 
                className="absolute pointer-events-none" 
                style={{
                    left: '50%',
                    top: '50%',
                    width: 0, 
                    height: 0,
                    zIndex: 1000,
                    overflow: 'visible'
                }}
             >
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="6"
                        markerHeight="4"
                        refX="5"
                        refY="2"
                        orient="auto"
                    >
                        <polygon points="0 0, 6 2, 0 4" fill="#22d3ee" />
                    </marker>
                </defs>
                <g className="animate-in fade-in duration-500">
                    {treeEdges.map((line, i) => (
                        <g key={i}>
                            <line 
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="#020617" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                                opacity="0.8"
                            />
                            <line 
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="#22d3ee" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                                markerEnd="url(#arrowhead)"
                            />
                        </g>
                    ))}
                    {treeEdges.length > 0 && (
                        <circle 
                            cx={treeEdges[0].x1} 
                            cy={treeEdges[0].y1} 
                            r={6} 
                            fill="#22d3ee" 
                            stroke="white"
                            strokeWidth="2"
                            className="animate-pulse"
                        />
                    )}
                </g>
             </svg>
        )}
      </div>

      {/* MOVABLE MENU */}
      <div 
        className="absolute bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-[1000] transition-all duration-300 ease-out overflow-hidden"
        style={{ 
            left: menuPos.x, 
            top: menuPos.y,
            width: isMenuMinimized ? '48px' : '320px',
            height: isMenuMinimized ? '48px' : 'auto'
        }}
        onMouseDown={(e) => e.stopPropagation()} 
      >
        {/* Menu Header (Drag Handle) */}
        <div 
            className="h-12 flex items-center justify-between px-3 bg-slate-800/50 cursor-move border-b border-slate-700/50"
            onMouseDown={handleMenuMouseDown}
        >
            <div className="flex items-center gap-2 text-slate-200 font-medium">
                {!isMenuMinimized && <span className="font-playfair text-lg tracking-wide">Escher Weave</span>}
                {isMenuMinimized && <GripHorizontal size={20} />}
            </div>
            <button 
                onClick={() => setIsMenuMinimized(!isMenuMinimized)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
                {isMenuMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
        </div>

        {/* Menu Content */}
        {!isMenuMinimized && (
            <div className="p-5 space-y-6">
                {/* Grid Controls */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            <span className="flex items-center gap-1"><LayoutGrid size={12}/> Grid Size</span>
                            <span>{gridSize}x{gridSize}</span>
                        </div>
                        <input 
                            type="range" min="1" max="8" step="1" value={gridSize} 
                            onChange={(e) => setGridSize(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            <span className="flex items-center gap-1"><MoveHorizontal size={12}/> Spacing X</span>
                            <span>{spacingX}px</span>
                        </div>
                        <input 
                            type="range" min="100" max="220" value={spacingX} 
                            onChange={(e) => setSpacingX(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            <span className="flex items-center gap-1"><MoveVertical size={12}/> Spacing Y</span>
                            <span>{spacingY}px</span>
                        </div>
                        <input 
                            type="range" min="170" max="360" value={spacingY} 
                            onChange={(e) => setSpacingY(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1"><Triangle size={12} className="rotate-180"/> Triangle Tilt</span>
                                
                                <input 
                                    type="checkbox" 
                                    checked={enableTriangleTilt} 
                                    onChange={(e) => setEnableTriangleTilt(e.target.checked)}
                                    className="w-3 h-3 rounded bg-slate-700 border-transparent text-sky-500 focus:ring-0 focus:ring-offset-0"
                                />

                                <div className="flex bg-slate-800 rounded border border-slate-700 p-0.5">
                                    <button 
                                        onClick={() => setTiltAxis('X')}
                                        className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${tiltAxis === 'X' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >X</button>
                                    <button 
                                        onClick={() => setTiltAxis('Y')}
                                        className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${tiltAxis === 'Y' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >Y</button>
                                </div>

                                <label className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors ml-1">
                                    <input 
                                        type="checkbox" 
                                        checked={linkTiltSpacing} 
                                        onChange={(e) => setLinkTiltSpacing(e.target.checked)}
                                        className="w-3 h-3 rounded bg-slate-700 border-transparent text-sky-500 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="text-[10px] text-slate-500">Link</span>
                                </label>
                            </div>
                            <span>{triangleTilt}</span>
                        </div>
                        <input 
                            type="range" min="-1" max="1" step="0.01" value={triangleTilt} 
                            onChange={(e) => setTriangleTilt(Number(e.target.value))}
                            disabled={!enableTriangleTilt}
                            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${enableTriangleTilt ? 'bg-slate-700 accent-sky-500 hover:accent-sky-400' : 'bg-slate-800 accent-slate-600'}`}
                        />
                    </div>

                    <div className="space-y-2">
                         <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1"><Square size={12} /> Square Rotation</span>
                                <input 
                                    type="checkbox" 
                                    checked={enableSquareTilt} 
                                    onChange={(e) => setEnableSquareTilt(e.target.checked)}
                                    className="w-3 h-3 rounded bg-slate-700 border-transparent text-purple-500 focus:ring-0 focus:ring-offset-0"
                                />
                            </div>
                            <span>{squareTilt}</span>
                        </div>
                        <input 
                            type="range" min="-4" max="4" step="1" value={squareTilt} 
                            onChange={(e) => setSquareTilt(Number(e.target.value))}
                            disabled={!enableSquareTilt}
                            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${enableSquareTilt ? 'bg-slate-700 accent-purple-500 hover:accent-purple-400' : 'bg-slate-800 accent-slate-600'}`}
                        />
                    </div>
                </div>

                {/* Interaction Mode */}
                <div className="space-y-3 pt-3 border-t border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Interaction Mode</div>
                    
                    {/* Row 1: Flip, Hide, Shuffle */}
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => setInteractionMode('FLIP')}
                            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-all border ${
                                interactionMode === 'FLIP' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ScanFace size={14} /> 
                            <span>Flip</span>
                        </button>
                        <button 
                            onClick={() => setInteractionMode('HIDE')}
                            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-all border ${
                                interactionMode === 'HIDE' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <EyeOff size={14} /> 
                            <span>Hide</span>
                        </button>
                        <button 
                            onClick={() => setInteractionMode('SHUFFLE')}
                            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-all border ${
                                interactionMode === 'SHUFFLE' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Dices size={14} /> 
                            <span>Swap</span>
                        </button>
                    </div>

                    {/* Row 2: Heatmap, Game */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => {
                                setInteractionMode('HEATMAP');
                                setSelectedNode(null); 
                            }}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all border ${
                                interactionMode === 'HEATMAP' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Thermometer size={16} /> 
                            <div className="flex flex-col items-start leading-none">
                                <span>Heatmap</span>
                                <span className="text-[9px] opacity-70 font-normal">View paths</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => {
                                setInteractionMode('GAME');
                                // Reset game state if starting fresh
                                if (!gameActiveNode) setIsGameStarted(false);
                            }}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all border ${
                                interactionMode === 'GAME' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Gamepad2 size={16} /> 
                            <div className="flex flex-col items-start leading-none">
                                <span>Game</span>
                                <span className="text-[9px] opacity-70 font-normal">Traverse</span>
                            </div>
                        </button>
                    </div>
                     
                     {interactionMode === 'GAME' && (
                        <div className="text-[10px] text-emerald-400/80 text-center px-2 bg-emerald-950/30 py-2 rounded border border-emerald-900/50">
                           {!isGameStarted 
                             ? "Click any card to start traversing." 
                             : "Click green zones (Distance 1) to step down."}
                        </div>
                     )}
                     {interactionMode === 'SHUFFLE' && (
                        <div className="text-[10px] text-amber-400/80 text-center px-2 bg-amber-950/30 py-2 rounded border border-amber-900/50">
                           Click a card to swap it with a new one.
                        </div>
                     )}
                </div>

                {/* Utility Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
                    <button 
                        onClick={() => {
                            setShuffleSeed(Math.random());
                            setCardOverrides(new Map());
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                        <Shuffle size={14} /> Shuffle All
                    </button>
                     <button 
                        onClick={handleFlipAll}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                        <Layers size={14} /> Flip All
                    </button>
                     <button 
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                        <RotateCcw size={14} /> Reset
                    </button>
                    <button 
                        onClick={() => setSpin(!spin)}
                        className={`flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors`}
                    >
                        {spin ? <RotateCw size={14} /> : <RotateCcw size={14} />} Spin
                    </button>
                    
                    {hiddenCards.size > 0 && (
                        <button 
                            onClick={() => setHiddenCards(new Set())}
                            className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors animate-in fade-in"
                        >
                            <Eye size={14} /> Unhide All ({hiddenCards.size})
                        </button>
                    )}

                     <button 
                        onClick={() => setShowDeckDebug(true)}
                        className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                    >
                        <LayoutGrid size={14} /> Inspect Deck
                    </button>

                    <button 
                        onClick={() => setShowHelpers(!showHelpers)}
                        className={`col-span-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${showHelpers ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
                    >
                        <Bug size={14} /> Debug Info
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default EscherWeave;
