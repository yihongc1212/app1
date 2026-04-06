'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  MessageSquare,
  Zap,
  Sparkles,
  FileText,
  PenLine,
  Send,
  Loader2,
  ChevronDown,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { ChatMessage } from '@/lib/types';

interface AIPanelProps {
  noteContent: string;
  noteTitle: string;
  onApplyResult?: (text: string) => void;
  onApplyTitle?: (title: string) => void;
}

type AIAction = 'summarize' | 'improve' | 'generate-title' | 'continue' | 'chat';
type TabType = 'actions' | 'chat';

interface AIResult {
  action: AIAction;
  content: string;
}

async function streamAIResponse(
  action: AIAction,
  noteContent: string,
  noteTitle: string,
  message?: string,
  chatHistory?: ChatMessage[],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      noteContent,
      noteTitle,
      message,
      chatHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk?.(chunk);
  }

  return fullText;
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="w-8 h-8 rounded-md bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center flex-shrink-0 transition-colors">
        {loading ? (
          <Loader2 size={16} className="text-indigo-600 animate-spin" />
        ) : (
          <Icon size={16} className="text-indigo-600" />
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

export default function AIPanel({
  noteContent,
  noteTitle,
  onApplyResult,
  onApplyTitle,
}: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('actions');
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingMessage]);

  const runAction = async (action: AIAction) => {
    if (!noteContent.trim() && !noteTitle.trim()) {
      setResult({ action, content: 'Please write something in the note first.' });
      return;
    }

    setLoadingAction(action);
    setResult({ action, content: '' });
    setIsStreaming(true);

    try {
      await streamAIResponse(
        action,
        noteContent,
        noteTitle,
        undefined,
        undefined,
        (chunk) => {
          setResult((prev) => ({
            action,
            content: (prev?.content || '') + chunk,
          }));
        }
      );
    } catch (error) {
      setResult({
        action,
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
      });
    } finally {
      setLoadingAction(null);
      setIsStreaming(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    const newUserMsg: ChatMessage = { role: 'user', content: userMessage };
    const updatedHistory = [...chatMessages, newUserMsg];
    setChatMessages(updatedHistory);
    setIsChatLoading(true);
    setStreamingMessage('');

    try {
      let accumulatedText = '';
      await streamAIResponse(
        'chat',
        noteContent,
        noteTitle,
        userMessage,
        chatMessages,
        (chunk) => {
          accumulatedText += chunk;
          setStreamingMessage(accumulatedText);
        }
      );

      setChatMessages([
        ...updatedHistory,
        { role: 'assistant', content: accumulatedText },
      ]);
      setStreamingMessage('');
    } catch (error) {
      setChatMessages([
        ...updatedHistory,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        },
      ]);
      setStreamingMessage('');
    } finally {
      setIsChatLoading(false);
    }
  };

  const getActionLabel = (action: AIAction): string => {
    switch (action) {
      case 'summarize': return 'Summary';
      case 'improve': return 'Improved Writing';
      case 'generate-title': return 'Suggested Titles';
      case 'continue': return 'Continued Writing';
      default: return 'Result';
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-gray-50 border-l border-gray-200"
      style={{ width: '320px', minWidth: '320px' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">AI Assistant</h3>
            <p className="text-xs text-gray-400">Powered by Claude</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'actions'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap size={14} />
          Actions
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare size={14} />
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'actions' && (
          <div className="p-3 space-y-2">
            {/* Action Buttons */}
            <div className="space-y-2">
              <ActionButton
                icon={FileText}
                label="Summarize"
                description="Get a concise summary of this note"
                onClick={() => runAction('summarize')}
                loading={loadingAction === 'summarize'}
              />
              <ActionButton
                icon={Sparkles}
                label="Improve Writing"
                description="Enhance clarity, flow, and style"
                onClick={() => runAction('improve')}
                loading={loadingAction === 'improve'}
              />
              <ActionButton
                icon={PenLine}
                label="Generate Title"
                description="Suggest compelling titles"
                onClick={() => runAction('generate-title')}
                loading={loadingAction === 'generate-title'}
              />
              <ActionButton
                icon={ChevronDown}
                label="Continue Writing"
                description="Continue from where you left off"
                onClick={() => runAction('continue')}
                loading={loadingAction === 'continue'}
              />
            </div>

            {/* Result Area */}
            {result && (
              <div className="mt-4 fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {getActionLabel(result.action)}
                  </span>
                  <div className="flex items-center gap-1">
                    {!isStreaming && result.content && (
                      <CopyButton text={result.content} />
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <p className={`text-sm text-gray-700 whitespace-pre-wrap leading-relaxed ${isStreaming ? 'streaming-cursor' : ''}`}>
                    {result.content || (isStreaming ? '' : 'No content')}
                  </p>
                  {!isStreaming && result.content && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      {result.action === 'generate-title' && onApplyTitle && (
                        <button
                          onClick={() => {
                            const firstTitle = result.content.split('\n')[0].trim();
                            onApplyTitle(firstTitle);
                          }}
                          className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors font-medium"
                        >
                          Apply First Title
                        </button>
                      )}
                      {(result.action === 'improve' || result.action === 'continue') && onApplyResult && (
                        <button
                          onClick={() => onApplyResult(result.content)}
                          className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors font-medium"
                        >
                          Apply to Note
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 && !streamingMessage && (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">Chat with your note</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ask questions about the content
                  </p>
                  <div className="mt-4 space-y-2">
                    {['What are the main points?', 'Summarize this', 'What action items are mentioned?'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setChatInput(suggestion)}
                        className="block w-full text-left text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={12} className="text-gray-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="flex gap-2 justify-start fade-in">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700">
                    <p className={`whitespace-pre-wrap leading-relaxed ${isChatLoading ? 'streaming-cursor' : ''}`}>
                      {streamingMessage}
                    </p>
                  </div>
                </div>
              )}

              {isChatLoading && !streamingMessage && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="Ask about your note..."
                  rows={1}
                  className="flex-1 resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                  style={{ minHeight: '38px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title="Send (Enter)"
                >
                  {isChatLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
