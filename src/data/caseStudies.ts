import type { CaseStudyDetail } from '@/types'

export const caseStudies: CaseStudyDetail[] = [
  {
    slug: 'ai-application-generator',
    title: 'Building an AI Service for Application Generation',
    subtitle: 'Architecting a scalable backend system to bring AI-powered app generation to a no-code platform',
    company: 'Betty Blocks',
    year: 2024,
    tags: ['AI Integration', 'Node.js', 'WebSockets', 'Architecture'],
    summary: 'Led the development of a backend Node.js system that handles AI-powered application generation at scale, featuring dynamic prompt engineering, real-time streaming, and micro-frontend architecture.',
    
    context: 'Betty Blocks is a no-code platform that enables enterprises to build applications without traditional programming. To expand into the AI space, we needed to build a system that could leverage AI to generate full applications—not just code snippets, but complete, functional app components.\n\nThis was a greenfield project with high visibility. The challenge was not just making AI work, but making it work reliably at enterprise scale with real-time feedback to users.',

    problem: 'The core technical challenges were interconnected:\n\n- AI responses are slow and unpredictable—users need immediate feedback\n- Generated content needs to be transformed into platform-specific formats\n- Large data payloads needed to flow between services efficiently\n- The frontend needed real-time updates without polling\n\nBeyond the technical aspects, we needed to design a system flexible enough to support multiple AI use cases as the product evolved.',

    constraints: [
      'Real-time user feedback required—no waiting for complete AI responses',
      'Large data transformations needed to happen server-side to protect client performance',
      'System needed to support multiple AI providers and prompt strategies',
      'Integration with existing micro-frontend architecture was mandatory',
    ],

    architecturalDecisions: [
      {
        title: 'WebSocket-Based Streaming Architecture',
        decision: 'Built a persistent WebSocket connection between frontend and backend for bi-directional real-time communication',
        rationale: 'HTTP request/response would leave users staring at a loading spinner for 30+ seconds. WebSocket streaming lets us push partial results immediately, showing progress and keeping users engaged.',
      },
      {
        title: 'Dynamic Prompt Engineering Layer',
        decision: 'Created an abstraction layer that constructs prompts based on request type, context, and user input',
        rationale: 'Hardcoded prompts would require code changes for every tweak. A dynamic system lets us iterate on prompt strategies without deployments and A/B test different approaches.',
      },
      {
        title: 'Server-Side Data Transformation Pipeline',
        decision: 'All large data transformations happen on the backend before streaming to the client',
        rationale: 'AI outputs need significant processing to become platform-compatible. Doing this client-side would freeze the UI and expose transformation logic. Server-side keeps clients thin and responsive.',
      },
      {
        title: 'Request Type Router Pattern',
        decision: 'Frontend sends a request type identifier, backend routes to appropriate handler with its own prompt strategy and processing pipeline',
        rationale: 'Keeps the system extensible. Adding new AI features means adding a new handler, not modifying existing code paths.',
      },
    ],

    tradeoffs: [
      {
        choice: 'WebSocket over Server-Sent Events',
        tradeoff: 'More complex connection management and reconnection logic, but enables bi-directional communication for features like cancellation and progress updates.',
      },
      {
        choice: 'Centralized backend service over distributed',
        tradeoff: 'Single point of failure risk, but simpler to optimize, monitor, and maintain. Added redundancy through proper error handling and graceful degradation.',
      },
      {
        choice: 'Dynamic prompts over versioned prompt templates',
        tradeoff: 'Harder to reproduce exact behavior for debugging, but allows rapid iteration. Mitigated by logging complete prompts for each request.',
      },
    ],

    result: 'The system launched successfully and became a core differentiator for the platform:\n\n- Real-time streaming reduced perceived wait times by 80%\n- Modular architecture enabled 5 new AI features in the following quarter\n- Backend handles thousands of concurrent AI sessions\n- Zero client performance degradation despite large data payloads\n\nThe project demonstrated that AI integration is as much about user experience and architecture as it is about the AI itself.',

    codeSnippets: [
      {
        title: 'WebSocket Request Handler Pattern',
        language: 'typescript',
        code: `type RequestType = 'generate-page' | 'generate-component' | 'suggest-logic';

interface AIRequest {
  type: RequestType;
  context: AppContext;
  userInput: string;
}

const handlers: Record<RequestType, RequestHandler> = {
  'generate-page': new PageGenerationHandler(),
  'generate-component': new ComponentGenerationHandler(),
  'suggest-logic': new LogicSuggestionHandler(),
};

ws.on('message', async (data) => {
  const request = parseRequest(data);
  const handler = handlers[request.type];
  
  if (!handler) {
    ws.send(JSON.stringify({ error: 'Unknown request type' }));
    return;
  }
  
  for await (const chunk of handler.process(request)) {
    ws.send(JSON.stringify({ type: 'chunk', data: chunk }));
  }
  
  ws.send(JSON.stringify({ type: 'complete' }));
});`,
        explanation: 'The router pattern keeps handlers isolated and testable. Each handler implements the same async generator interface, enabling consistent streaming behavior.',
      },
    ],

    diagrams: [
      {
        title: 'System Architecture',
        description: 'Request flow from frontend through WebSocket to AI service and back',
        placeholder: '[ Frontend ] ←WebSocket→ [ Node.js Service ] ←HTTP→ [ AI Provider ] → [ Transform ] → [ Stream to Client ]',
      },
    ],
  },
  {
    slug: 'scalable-component-tree',
    title: 'Building a Fast and Scalable Component Tree',
    subtitle: 'Replacing a buggy tree view with a high-performance solution using React optimization patterns',
    company: 'Betty Blocks',
    year: 2023,
    tags: ['React', 'Performance', 'UI Components', 'Initiative'],
    summary: 'Identified performance issues in the platform\'s page builder tree view and took initiative to build a proof-of-concept that became the production solution—faster, more reliable, and scalable to thousands of components.',
    
    context: 'The Betty Blocks page builder is a visual editor where users construct application pages by arranging components in a hierarchical structure. This structure is displayed as a tree view that users interact with constantly—selecting, reordering, nesting, and editing components.\n\nThe existing tree implementation had accumulated technical debt. It was slow with large component counts, had subtle bugs with drag-and-drop, and the codebase had become difficult to maintain.',

    problem: 'The tree view had multiple interconnected issues:\n\n- Performance degraded significantly beyond 200 components\n- Re-renders cascaded through the entire tree on any change\n- Drag-and-drop had edge cases that caused incorrect nesting\n- State management was scattered and hard to reason about\n\nPrevious attempts to fix these issues had added complexity without solving the root causes. The codebase needed a fresh approach, not more patches.',

    constraints: [
      'Must support trees with 1000+ components without lag',
      'Feature parity with existing implementation required',
      'Could not disrupt ongoing feature development—needed to be a clean swap',
      'Had to prove the concept before getting buy-in for full implementation',
    ],

    architecturalDecisions: [
      {
        title: 'Proof-of-Concept First Approach',
        decision: 'Built a working PoC on my own initiative before proposing the rewrite to stakeholders',
        rationale: 'Proposals for rewrites often get rejected because the risk is unclear. A working demo shows exactly what\'s possible and de-risks the decision for stakeholders.',
      },
      {
        title: 'Aggressive Memoization Strategy',
        decision: 'Used useMemo and useCallback extensively to prevent unnecessary re-renders',
        rationale: 'Tree structures are worst-case for React rendering—a change at any level can trigger re-renders all the way down. Memoization breaks this cascade by ensuring stable references.',
      },
      {
        title: 'Virtualized Rendering for Large Trees',
        decision: 'Only render visible tree nodes, with buffer zones for smooth scrolling',
        rationale: 'With 1000+ components, rendering everything to the DOM is wasteful. Virtualization keeps the DOM small regardless of data size.',
      },
      {
        title: 'Normalized State Structure',
        decision: 'Stored tree data in a flat normalized structure with parent references rather than deeply nested objects',
        rationale: 'Deeply nested state is hard to update immutably and causes reference changes to cascade. Normalized data enables surgical updates to individual nodes.',
      },
    ],

    tradeoffs: [
      {
        choice: 'Full rewrite over incremental refactor',
        tradeoff: 'Higher upfront investment, but the existing code\'s architecture made incremental fixes ineffective. Clean slate enabled proper patterns from the start.',
      },
      {
        choice: 'Heavy memoization over simpler code',
        tradeoff: 'Added complexity to component logic, but performance requirements made this necessary. Documented patterns clearly for team understanding.',
      },
      {
        choice: 'Custom virtualization over library',
        tradeoff: 'More implementation work, but tree virtualization has specific requirements (variable heights, nested expansion) that generic libraries handle poorly.',
      },
    ],

    result: 'The new tree view shipped and immediately improved the page builder experience:\n\n- Renders 1000+ components at 60fps (previous implementation stuttered at 200)\n- Eliminated all known drag-and-drop bugs\n- Reduced tree-related bug reports by 90%\n- Codebase is now maintainable and well-documented\n\nThe project also demonstrated the value of developer initiative—identifying problems and proposing solutions rather than waiting for tickets.',

    codeSnippets: [
      {
        title: 'Memoized Tree Node Component',
        language: 'tsx',
        code: `interface TreeNodeProps {
  nodeId: string;
  depth: number;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

export const TreeNode = memo(function TreeNode({ 
  nodeId, 
  depth, 
  onSelect, 
  onToggle 
}: TreeNodeProps) {
  const node = useNodeData(nodeId);
  const isSelected = useIsSelected(nodeId);
  const isExpanded = useIsExpanded(nodeId);
  
  const handleSelect = useCallback(() => {
    onSelect(nodeId);
  }, [nodeId, onSelect]);
  
  const handleToggle = useCallback(() => {
    onToggle(nodeId);
  }, [nodeId, onToggle]);
  
  if (!node) return null;
  
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <NodeContent 
        node={node}
        isSelected={isSelected}
        onSelect={handleSelect}
        onToggle={handleToggle}
      />
      {isExpanded && node.children.map(childId => (
        <TreeNode
          key={childId}
          nodeId={childId}
          depth={depth + 1}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
});`,
        explanation: 'The key patterns: memo() prevents re-render if props are equal, useCallback keeps callback references stable, and custom hooks isolate state subscriptions to minimize re-render scope.',
      },
    ],

    diagrams: [
      {
        title: 'Render Optimization Flow',
        description: 'How memoization prevents cascade re-renders in the tree structure',
        placeholder: '[ Parent Change ] → [ Stable Callbacks ] → [ memo() Check ] → [ Skip Child Re-render ]',
      },
    ],
  },
  {
    slug: 'team-performance-alignment',
    title: 'Helping Development Teams Perform',
    subtitle: 'Identifying team bottlenecks and implementing alignment practices that improved collaboration',
    company: 'Betty Blocks',
    year: 2023,
    tags: ['Team Leadership', 'Communication', 'Process Improvement'],
    summary: 'Observed misalignment and communication gaps in a development team, then implemented bi-weekly alignment sessions that transformed team dynamics and delivery.',
    
    context: 'I\'ve worked across multiple development teams at Betty Blocks, and in each one I pay attention to what\'s holding the team back. Technical problems are often symptoms of people problems—miscommunication, unclear goals, or siloed knowledge.\n\nIn one team, I noticed a pattern: developers were working hard but often in slightly different directions. People didn\'t know what others were working on, and there was no shared understanding of the bigger picture we were building toward.',

    problem: 'The symptoms were subtle but impactful:\n\n- Duplicate work when two devs unknowingly tackled related problems\n- Integration conflicts because approaches weren\'t aligned early\n- Hesitancy to ask questions or raise concerns\n- Sprint goals achieved but overall progress felt slow\n\nThis wasn\'t a hostile or dysfunctional team—just a quiet one. People were heads-down on their tasks without enough moments to surface and align.',

    constraints: [
      'Could not mandate large process changes—needed voluntary participation',
      'Had to respect existing sprint ceremonies and not add meeting fatigue',
      'Needed to create safety for people to speak up without forcing it',
      'Changes had to show results quickly to maintain buy-in',
    ],

    architecturalDecisions: [
      {
        title: 'Bi-Weekly Developer Alignment Sessions',
        decision: 'Established a regular 30-minute session just for developers, no managers, focused on alignment rather than status',
        rationale: 'Standups are too brief for real discussion. Retrospectives happen too infrequently. A dedicated developer-only space encourages honest conversation about technical direction.',
      },
      {
        title: 'Open Question Format',
        decision: 'Instead of status updates, asked each developer if they had questions or concerns about what we\'re building as a team',
        rationale: 'Status updates encourage "everything is fine" responses. Questions encourage curiosity and surface hidden confusion or disagreement.',
      },
      {
        title: 'Voluntary Facilitation Rotation',
        decision: 'Rotated who led the session to distribute ownership',
        rationale: 'If one person always runs it, it becomes "their meeting." Rotation made it truly a team practice.',
      },
    ],

    tradeoffs: [
      {
        choice: 'Informal sessions over structured agile ceremony',
        tradeoff: 'Less measurable and documented, but lower friction and more likely to get honest participation.',
      },
      {
        choice: 'Developer-only over whole team',
        tradeoff: 'Excludes valuable stakeholder perspectives, but creates psychological safety for technical disagreements and questions.',
      },
      {
        choice: 'Bi-weekly over weekly',
        tradeoff: 'Less frequent touchpoints, but respects team\'s time and keeps sessions from feeling like overhead.',
      },
    ],

    result: 'The impact went beyond the sessions themselves:\n\n- Developers started collaborating outside of scheduled meetings\n- Technical decisions were discussed earlier, reducing integration issues\n- New team members ramped up faster with better context sharing\n- Team velocity increased as duplicated effort decreased\n\nThe biggest win was cultural: people felt more connected to each other and to the team\'s mission. Technical excellence comes from teams that communicate well.',

    codeSnippets: [],

    diagrams: [
      {
        title: 'Before and After Team Dynamics',
        description: 'How communication patterns changed with alignment sessions',
        placeholder: '[ Before: Siloed Work ] → [ Alignment Sessions ] → [ After: Connected Collaboration ]',
      },
    ],
  },
]

export function getCaseStudyBySlug(slug: string): CaseStudyDetail | undefined {
  return caseStudies.find(cs => cs.slug === slug)
}
