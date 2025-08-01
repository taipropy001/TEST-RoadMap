import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, Share2, Download, Maximize2, Minimize2 } from 'lucide-react';
import { JiraTicket } from '../../types';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import html2canvas from 'html2canvas';

interface TimelineProps {
  tickets: JiraTicket[];
}

interface GroupedTickets {
  [epicKey: string]: {
    [parentKey: string]: JiraTicket[];
  };
}

export const Timeline: React.FC<TimelineProps> = ({ tickets }) => {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Group tickets by epic and then by parent issue
  const groupedTickets: GroupedTickets = tickets.reduce((acc, ticket) => {
    const epicKey = ticket.epic_link || 'standalone';
    const parentKey = ticket.parent_issue_key || ticket.key; // Use ticket's own key if it's not a sub-task
    
    if (!acc[epicKey]) {
      acc[epicKey] = {};
    }
    if (!acc[epicKey][parentKey]) {
      acc[epicKey][parentKey] = [];
    }
    
    acc[epicKey][parentKey].push(ticket);
    return acc;
  }, {} as GroupedTickets);

  // Calculate timeline bounds using start_date instead of created_date
  const allDates = tickets.flatMap(t => [t.start_date, t.due_date, t.created_date])
    .filter(Boolean) // Remove null/undefined values
    .filter(dateString => {
      // Ensure it's a string and can be parsed as a valid date
      if (typeof dateString !== 'string' || !dateString.trim()) return false;
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    });

  const minDate = allDates.length > 0 
    ? startOfMonth(new Date(Math.min(...allDates.map(d => new Date(d).getTime())))) 
    : new Date();
  const maxDate = allDates.length > 0 
    ? endOfMonth(new Date(Math.max(...allDates.map(d => new Date(d).getTime())))) 
    : addMonths(new Date(), 6);

  const totalDays = differenceInDays(maxDate, minDate);
  const monthsInRange = [];
  let currentMonth = minDate;
  while (currentMonth <= maxDate) {
    monthsInRange.push(currentMonth);
    currentMonth = addMonths(currentMonth, 1);
  }

  const getTicketPosition = (date: string | null) => {
    if (!date || typeof date !== 'string') return 0;
    try {
      const ticketDate = parseISO(date);
      if (isNaN(ticketDate.getTime())) return 0;
      const daysDiff = differenceInDays(ticketDate, minDate);
      return (daysDiff / totalDays) * 100;
    } catch (error) {
      console.warn('Invalid date string:', date);
      return 0;
    }
  };

  const getTicketWidth = (startDate: string | null, endDate?: string | null) => {
    if (!startDate || typeof startDate !== 'string') return 2;
    if (!endDate || typeof endDate !== 'string') return 2; // Minimum width for milestones
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 2;
      
      const duration = differenceInDays(end, start);
      return Math.max((duration / totalDays) * 100, 2);
    } catch (error) {
      console.warn('Invalid date strings:', startDate, endDate);
      return 2;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'To Do': 'bg-gray-400',
      'In Progress': 'bg-blue-500',
      'In Review': 'bg-yellow-500',
      'Done': 'bg-green-500',
      'Blocked': 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const toggleEpicExpanded = (epicKey: string) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(epicKey)) {
      newExpanded.delete(epicKey);
    } else {
      newExpanded.add(epicKey);
    }
    setExpandedEpics(newExpanded);
  };

  const toggleParentExpanded = (epicKey: string, parentKey: string) => {
    const combinedKey = `${epicKey}:${parentKey}`;
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(combinedKey)) {
      newExpanded.delete(combinedKey);
    } else {
      newExpanded.add(combinedKey);
    }
    setExpandedParents(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedEpics(new Set());
      setExpandedParents(new Set());
    } else {
      // Expand all epics
      const allEpics = new Set(Object.keys(groupedTickets));
      setExpandedEpics(allEpics);
      
      // Expand all parent tasks that have sub-tasks
      const allParents = new Set<string>();
      Object.entries(groupedTickets).forEach(([epicKey, parents]) => {
        Object.entries(parents).forEach(([parentKey, tickets]) => {
          if (tickets.length > 1 || tickets.some(t => t.parent_issue_key)) {
            allParents.add(`${epicKey}:${parentKey}`);
          }
        });
      });
      setExpandedParents(allParents);
    }
    setExpandAll(!expandAll);
  };

  const exportAsPNG = async () => {
    if (!timelineRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(timelineRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        height: timelineRef.current.scrollHeight,
        windowHeight: timelineRef.current.scrollHeight,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
      });

      const link = document.createElement('a');
      link.download = `roadmap-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to export timeline:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('shared', 'true');
    return url.toString();
  };

  const generateEmbedCode = () => {
    const shareUrl = generateShareLink();
    return `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`;
  };

  // Helper function to check if a parent has sub-tasks
  const hasSubTasks = (parentTickets: JiraTicket[]) => {
    return parentTickets.some(ticket => ticket.parent_issue_key);
  };

  // Helper function to get the parent ticket (non-sub-task)
  const getParentTicket = (parentTickets: JiraTicket[]) => {
    return parentTickets.find(ticket => !ticket.parent_issue_key) || parentTickets[0];
  };

  // Helper function to get sub-tasks
  const getSubTasks = (parentTickets: JiraTicket[]) => {
    return parentTickets.filter(ticket => ticket.parent_issue_key);
  };

  if (tickets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Maximize2 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets to display</h3>
          <p className="text-gray-600">
            Sync your Jira data or adjust your filters to see your roadmap timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Timeline Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Timeline View</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleExpandAll}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expandAll ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{expandAll ? 'Collapse All' : 'Expand All'}</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        <div ref={timelineRef} className="bg-white">
          {/* Timeline Header with Months */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-80 flex-shrink-0 px-6 py-4 font-medium text-gray-900 bg-white border-r border-gray-200">
                Task
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {monthsInRange.map((month, index) => (
                    <div
                      key={index}
                      className="flex-1 px-4 py-4 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
                      {format(month, 'MMM yyyy')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="divide-y divide-gray-200">
            {Object.entries(groupedTickets).map(([epicKey, parents]) => {
              const isEpicExpanded = expandedEpics.has(epicKey);
              const isStandalone = epicKey === 'standalone';
              const epicTicket = isStandalone ? null : tickets.find(t => t.key === epicKey);

              return (
                <div key={epicKey}>
                  {/* Epic Row (if not standalone) */}
                  {!isStandalone && (
                    <div className="flex items-center bg-blue-50 hover:bg-blue-100 transition-colors">
                      <div className="w-80 flex-shrink-0 px-6 py-4 border-r border-gray-200">
                        <button
                          onClick={() => toggleEpicExpanded(epicKey)}
                          className="flex items-center space-x-3 w-full text-left"
                        >
                          {isEpicExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-blue-900 break-words">{epicKey}</div>
                            <div className={`text-sm text-blue-700 leading-relaxed ${isExporting ? 'break-words' : 'truncate'}`}>
                              {epicTicket?.summary || 'Epic'}
                            </div>
                          </div>
                        </button>
                      </div>
                      <div className="flex-1 relative px-4 py-4">
                        {/* Epic timeline bar using start_date */}
                        {epicTicket && epicTicket.start_date && (
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 h-6 bg-blue-600 rounded-lg shadow-sm opacity-80"
                            style={{
                              left: `${getTicketPosition(epicTicket.start_date)}%`,
                              width: `${getTicketWidth(epicTicket.start_date, epicTicket.due_date)}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Parent Tasks and Sub-tasks */}
                  {(isStandalone || isEpicExpanded) && Object.entries(parents).map(([parentKey, parentTickets]) => {
                    const parentTicket = getParentTicket(parentTickets);
                    const subTasks = getSubTasks(parentTickets);
                    const hasChildren = hasSubTasks(parentTickets);
                    const isParentExpanded = expandedParents.has(`${epicKey}:${parentKey}`);

                    return (
                      <div key={`${epicKey}:${parentKey}`}>
                        {/* Parent Task Row */}
                        <div className="flex items-center hover:bg-gray-50 transition-colors">
                          <div className={`w-80 flex-shrink-0 px-6 py-4 border-r border-gray-200 ${!isStandalone ? 'pl-12' : ''}`}>
                            <div className="flex items-center space-x-3">
                              {hasChildren && (
                                <button
                                  onClick={() => toggleParentExpanded(epicKey, parentKey)}
                                  className="flex-shrink-0"
                                >
                                  {isParentExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                              )}
                              <div
                                className={`w-3 h-3 rounded-full ${getStatusColor(parentTicket.status)} ${!hasChildren ? 'ml-6' : ''}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 break-words">{parentTicket.key}</div>
                                <div className="text-xs text-gray-500 font-mono">{parentTicket.project_key}</div>
                                <div className={`text-sm text-gray-600 leading-relaxed ${isExporting ? 'break-words' : 'truncate'}`}>
                                  {parentTicket.summary}
                                </div>
                                <div className="flex items-center space-x-2 mt-1 flex-wrap">
                                  {parentTicket.labels.slice(0, 2).map((label, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                  {parentTicket.labels.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{parentTicket.labels.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 relative px-4 py-4">
                            {/* Parent ticket timeline bar - show if has start_date or is in progress */}
                            {(parentTicket.start_date || parentTicket.status === 'In Progress' || parentTicket.status === 'In Development' || parentTicket.status === 'Development' || parentTicket.status === 'Doing') && (
                              <div
                                className={`absolute top-1/2 transform -translate-y-1/2 h-4 ${getStatusColor(parentTicket.status)} rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                                style={{
                                  left: `${getTicketPosition(parentTicket.start_date || parentTicket.created_date)}%`,
                                  width: `${getTicketWidth(parentTicket.start_date, parentTicket.due_date)}%`,
                                }}
                                title={`${parentTicket.key}: ${parentTicket.summary}\nStatus: ${parentTicket.status}\nAssignee: ${parentTicket.assignee || 'Unassigned'}\nStarted: ${parentTicket.start_date ? format(parseISO(parentTicket.start_date), 'MMM dd, yyyy') : 'Not started yet'}`}
                              />
                            )}
                            
                            {/* Due date marker */}
                            {parentTicket.due_date && (
                              <div
                                className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"
                                style={{
                                  left: `${getTicketPosition(parentTicket.due_date)}%`,
                                }}
                                title={`Due: ${format(parseISO(parentTicket.due_date), 'MMM dd, yyyy')}`}
                              />
                            )}
                          </div>
                        </div>

                        {/* Sub-tasks */}
                        {hasChildren && isParentExpanded && subTasks.map((subTask) => (
                          <div key={subTask.id} className="flex items-center hover:bg-gray-50 transition-colors bg-gray-25">
                            <div className={`w-80 flex-shrink-0 px-6 py-3 border-r border-gray-200 ${!isStandalone ? 'pl-20' : 'pl-14'}`}>
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${getStatusColor(subTask.status)}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-800 break-words">{subTask.key}</div>
                                  <div className="text-xs text-gray-500 font-mono">{subTask.project_key}</div>
                                  <div className={`text-xs text-gray-600 leading-relaxed ${isExporting ? 'break-words' : 'truncate'}`}>
                                    {subTask.summary}
                                  </div>
                                  <div className="flex items-center space-x-1 mt-1 flex-wrap">
                                    {subTask.labels.slice(0, 1).map((label, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                    {subTask.labels.length > 1 && (
                                      <span className="text-xs text-gray-500">
                                        +{subTask.labels.length - 1}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 relative px-4 py-3">
                              {/* Sub-task timeline bar - show if has start_date or is in progress */}
                              {(subTask.start_date || subTask.status === 'In Progress' || subTask.status === 'In Development' || subTask.status === 'Development' || subTask.status === 'Doing') && (
                                <div
                                  className={`absolute top-1/2 transform -translate-y-1/2 h-3 ${getStatusColor(subTask.status)} rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow opacity-90`}
                                  style={{
                                    left: `${getTicketPosition(subTask.start_date || subTask.created_date)}%`,
                                    width: `${getTicketWidth(subTask.start_date, subTask.due_date)}%`,
                                  }}
                                  title={`${subTask.key}: ${subTask.summary}\nStatus: ${subTask.status}\nAssignee: ${subTask.assignee || 'Unassigned'}\nStarted: ${subTask.start_date ? format(parseISO(subTask.start_date), 'MMM dd, yyyy') : 'Not started yet'}`}
                                />
                              )}
                              
                              {/* Due date marker */}
                              {subTask.due_date && (
                                <div
                                  className="absolute top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white shadow-sm"
                                  style={{
                                    left: `${getTicketPosition(subTask.due_date)}%`,
                                  }}
                                  title={`Due: ${format(parseISO(subTask.due_date), 'MMM dd, yyyy')}`}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Roadmap</h3>
            <div className="space-y-4">
              <button
                onClick={exportAsPNG}
                disabled={isExporting}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {isExporting ? 'Exporting...' : 'Export as PNG'}
                  </div>
                  <div className="text-sm text-gray-600">Download timeline as image</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateShareLink());
                  alert('Share link copied to clipboard!');
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Copy Share Link</div>
                  <div className="text-sm text-gray-600">Generate shareable URL</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateEmbedCode());
                  alert('Embed code copied to clipboard!');
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Maximize2 className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Copy Embed Code</div>
                  <div className="text-sm text-gray-600">Embed in websites</div>
                </div>
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};