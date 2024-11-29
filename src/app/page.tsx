'use client';

import React, { useState, useRef, useEffect } from 'react';
import { faAdd, faArrowUp, faClose, faCoffee, faFilePdf, faGear, faRotateRight, faShower, faThumbTack } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactMarkdown from 'react-markdown';
import Notification from './notify';
import styles from './styles/Home.module.css';
import { openDatabase, saveTextToIndexedDB, getTextFromIndexedDB, deleteTextFromIndexedDB, openVoiceDatabase, saveAndPlayAudio } from "./backend/utils/indexdb";

export default function Home() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I assist you today?', type: 'answer' },
    { sender: 'bot', text: `Deep Learning (DL) is a subset of machine learning that involves neural networks with multiple layers. It has significantly impacted various fields, including medical imaging, natural language processing, and computer vision. Deep Learning models have the ability to learn complex patterns and representations in data, which has led to advancements in automation, data analysis, and predictions. In the medical field, DL is used for tasks such as brain biomarker interpretation, medical image segmentation, and cancer prediction through histology images. It also improves cybersecurity through threat detection models that incorporate domain knowledge. Moreover, DL techniques are being studied for their interpretability, with methods developed to better explain predictions and learning processes to users. Future research in DL may focus on enhancing model interpretability, incorporating domain-specific knowledge to improve model accuracy, and tackling challenges like adversarial attacks. These advancements hold the potential to drive further technological and societal growth.`, type: 'answer' }, 
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFileWindow, setShowFileWindow] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validated, setValidated] = useState(true);
  const [fileName, setFileName] = useState('');
  const [indexName, setIndexName] = useState('');
  const [showSetUpWindow, setShowSetUpWindow] = useState(false);
  const [isSavingSetUp, setIsSavingSetUp] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isMemoryOn, setIsMemoryOn] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' |'info' } | null>(null);  // notification message
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newTextareaRef = useRef<HTMLTextAreaElement>(null);
  const apiEndpoint = 'http://localhost:3001/';
  const [overlayStyle, setOverlayStyle] = useState<{ display: string; top?: string; left?: string }>({ display: 'none' });
  const [selectedText, setSelectedText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const overlayRef = useRef(null);

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection!.toString().trim();

      if (text.length > 0) {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectedText(text);
        setOverlayStyle({
          top: window.scrollY + rect.top - 50 + 'px',
          left: window.scrollX + rect.left + rect.width / 2 - 70 + 'px',
          display: 'block',
        });
      } else {
        setOverlayStyle({ display: 'none' });
      }
    };

    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle click outside the overlay to hide it
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        overlayRef.current &&
        !(overlayRef.current as HTMLElement).contains(event.target)
      ) {
        setOverlayStyle({ display: 'none' });
        window.getSelection()!.removeAllRanges();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getFileName = () => {
    return fileName.length > 15 ? `${fileName.substring(0, 15)}...` : fileName;
  };

  const createIndex = async () => {
    setNotification({"message":"Creating index...","type":"info"});
    try {
      const response = await fetch(`${apiEndpoint}api/createIndex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error creating index');
      }

      const data = await response.json();
      setIndexName(data.indexName);
      console.log('Index created successfully:', data.indexName);
      setNotification({ message: 'Index created successfully', type: 'success' });
      return data.indexName;
    } catch (error) {
      console.error('Error creating index:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, there was an error creating the index. Please try again.', type: 'answer' }]);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    setLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: input, type: 'query' }]);
    setInput('');
    setNotification({"message":"Processing your query...","type":"info"});

    try {
      if (!indexName) {
        throw new Error('No index available. Please upload a file first.');
      }

      const response = await fetch(`${apiEndpoint}api/queryIndex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ indexName, question: input, systemPrompt: getSystemPrompt() }),
      });

      if (!response.ok) {
        throw new Error('Error querying index');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.newAnswer, type: 'answer' }]);
      if (data.n === 0) {
        setMessages(prev => [...prev, { sender: 'bot', text: "Browsing the web...", type: 'answer' }]);
        await webSearch(input);
      }
    } catch (error: any) {
      console.error('Error querying index:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: error.message, type: 'answer' }]);
    } finally {
      setLoading(false);
    }
  };

  const webSearch = async (query: string) => {
    console.log('Searching the web...');
    setNotification({"message":"Searching the web...","type":"info"});

    try {
      const response = await fetch(`${apiEndpoint}api/webSearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, systemPrompt: getSystemPrompt() }),
      });

      if (!response.ok) {
        throw new Error('Error searching the web');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.newAnswer, type: 'answer' }]);
    } catch (error: any) {
      console.error('Error searching the web:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: error.message, type: 'answer' }]);
    }
  }

  const chatCompletion = async () => {
    if (input.trim() === '') return;

    setLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: replyText, type: 'reply' }]);
    setMessages(prev => [...prev, { sender: 'user', text: input, type: 'query' }]);
    setInput('');
    setNotification({"message":"Processing your query...","type":"info"});


    try {
      const response = await fetch(`${apiEndpoint}api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input, sReplyText: replyText }),
      });
  
      if (!response.ok) {
        throw new Error('Error completing chat');
      }
      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.answer, type: 'answer' }]);
    } catch (error: any) {
      console.error('Error completing chat:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: error.message, type: 'answer' }]);
    } finally {
      setLoading(false);
      setReplyText('');
    }
  };

  const updateIndex = async (file: any) => {
    console.log('Uploading file...');
    setNotification({"message":"Uploading file...","type":"info"});

    setProcessing(true);

    try {
      let currentIndexName = indexName;
      if (!currentIndexName) {
        currentIndexName = await createIndex();
        if (!currentIndexName) throw new Error('Failed to create index');
      }

      if (!file) {
        throw new Error('No file selected');
      }
  
      const formData = new FormData();
      formData.append('file', file);
      formData.append('indexName', currentIndexName);
  
      const response = await fetch(`${apiEndpoint}api/updateIndex`, {
        method: 'POST',
        body: formData, // No need to stringify or set Content-Type
      });
  
      if (!response.ok) {
        throw new Error('Error uploading file');
      }
  
      console.log('File uploaded successfully');
      setValidated(true);
      setIndexName(currentIndexName);
      setMessages(prev => [...prev, { sender: 'bot', text: 'File uploaded and processed successfully. You can now ask questions about its content.', type: 'answer' }]);
      setNotification({ message: 'File uploaded successfully', type: 'success' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, there was an error uploading the file. Please try again.', type: 'answer' }]);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      console.log('Selected file:', file);
      if (file) {
        setSelectedFile(file);
        setFileName(file.name);
        updateIndex(file);
      }
    }
  };

  const startOver = () => {
    console.log('Starting over...');
    console.log('initializing...');
    setMessages([{ sender: 'bot', text: 'Hello! How can I assist you today?', type: 'answer' }]);
    setInput('');
    setLoading(false);
    setProcessing(false);
    setShowFileWindow(false);
    setSelectedFile(null);
    setValidated(false);
    setFileName('');
    setIndexName('');
  }

  const cleanChat = () => {
    console.log('Cleaning chat...');
    setMessages([{ sender: 'bot', text: 'Hello! How can I assist you today?', type: 'answer' }]);
    setInput('');
  }

  const setUp = () => {
    console.log('Setting up...');
    setShowSetUpWindow(true);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (validated) {
        setMessages(prev => [...prev, { sender: 'user', text: input , type: 'query'}]);
        handleSendMessage();
      } else {
        setMessages(prev => [...prev, { sender: 'user', text: input, type: 'query' }]); 
        chatCompletion();
      }
    }
  };

  const handleInput = (e: any) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const loader = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <circle cx={4} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale0" attributeName="r" begin="0;svgSpinners3DotsScale1.end-0.25s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={12} cy={12} r={3} fill="currentColor">
        <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.6s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={20} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale1" attributeName="r" begin="svgSpinners3DotsScale0.end-0.45s" dur="0.75s" values="3;.2;3" />
      </circle>
    </svg>
  );

  // SetUpWindow Component
const SetUpWindow = ({ onClose, onSave, systemPrompt, setSystemPrompt, isMemoryOn, setIsMemoryOn }: {onClose: () => void, onSave: () => void, systemPrompt: string, setSystemPrompt: (s: string) => void, isMemoryOn: boolean, setIsMemoryOn: (m: boolean) => void}) => {
  return (
      <div className="relative w-[800px] flex flex-col gap-4 p-4">
          {/* Close Button */}
          <div className='text-white text-md'>Set up settings</div>
          <button
              onClick={onClose}
              className={`flex items-center justify-center w-10 h-10 rounded-full shadow cursor-pointer bg-[#eeeeee] text-black absolute top-2 right-4`}>
              {!isSavingSetUp 
                  ? <FontAwesomeIcon icon={faClose} />
                  : <span className='flex justify-center items-center text-black'>{loader()}</span>
              }
          </button>

          {/* Content */}
          <div className="flex flex-col gap-4 pt-12">
              {/* Textarea for system prompt */}
              <span className="text-white text-sm">System Prompt</span>
              <textarea
                  tabIndex={0}
                  ref={newTextareaRef}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={5}
                  className="p-2 border rounded-md border-gray-300 bg-white text-black outline-none"
                  placeholder="Enter your system prompt here..."
              />

              {/* Checkbox for memory option */}
              <label className="flex items-center">
                  <input
                      type="checkbox"
                      checked={isMemoryOn}
                      onChange={() => setIsMemoryOn(!isMemoryOn)}
                      className="mr-2"
                  />
                  <span className="text-white text-sm">Enable Web Search</span>
              </label>

              {/* Save Button */}
              <button 
                  disabled={isSavingSetUp}
                  onClick={onSave} 
                  className="bg-[#eeeeee] text-black p-2 rounded-md w-full font-bold">
                  {!isSavingSetUp 
                      ? <span className='flex justify-center items-center text-black'>Save</span>
                      : <span className='flex justify-center items-center text-black'>{loader()}</span>
                  }
              </button>
          </div>
      </div>
  );
};

  const setSystemPromptToLocalStorage = async () => {
    setIsSavingSetUp(true);
    localStorage.setItem('systemPrompt', JSON.stringify(systemPrompt));
    const db = await openDatabase();
    await saveTextToIndexedDB(db, 'systemPrompt', systemPrompt);
    setIsSavingSetUp(false); // Reset saving state after saving
    setShowSetUpWindow(false); // Close the setup window
    setNotification({ message: 'Settings saved successfully', type: 'success' });
    const s = await getTextFromIndexedDB(db, 'systemPrompt');
    console.log('systemPrompt:', s);
    console.log('Settings saved successfully');
};

const getSystemPrompt = async () => {
  const db = await openDatabase();
  const s = await getTextFromIndexedDB(db, 'systemPrompt');
  console.log('systemPrompt:', s);
  setSystemPrompt(s);
  return s;
};

const handleCloseSetUpWindow = () => {
  setShowSetUpWindow(false);
};

  return (
    <main className="flex min-h-screen flex-col justify-between">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Overlay Button */}
      <div
        id="overlay"
        ref={overlayRef}
        style={{
          position: 'absolute',
          ...overlayStyle,
          zIndex: 1000,
        }}
      >
        <TellAsStoryButton 
          selectedText={selectedText}
          replyCallback={() => {
            setReplying(true);
            setReplyText(selectedText);
          }}
        />
      </div>
      <div className='flex flex-col gap-4 fixed top-4 left-4'>
        <div className="relative flex items-center group">
          <button
            onClick={startOver}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
            >
            <FontAwesomeIcon icon={faRotateRight} />
          </button>
          <span className="absolute w-[80px] text-xs left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md bg-[#eeeeee] text-black px-2 py-1 before:content-[''] before:absolute before:right-full before:top-1/2 before:transform before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#eeeeee]">
            Start over
          </span>
        </div>
        <div className="relative flex items-center group">
          <button
            onClick={cleanChat}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
            >
            <FontAwesomeIcon icon={faShower} />
          </button>
          <span className="absolute w-[80px] text-xs left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md bg-[#eeeeee] text-black px-2 py-1 before:content-[''] before:absolute before:right-full before:top-1/2 before:transform before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#eeeeee]">
            Clear chat
          </span>
        </div>
        <div className="relative flex items-center group">
          <button
            onClick={setUp}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
            >
            <FontAwesomeIcon icon={faGear} />
          </button>
          <span className="absolute w-[80px] text-xs left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md bg-[#eeeeee] text-black px-2 py-1 before:content-[''] before:absolute before:right-full before:top-1/2 before:transform before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#eeeeee]">
            Set up
          </span>
        </div>
      </div>
      {showSetUpWindow && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
        <div className="bg-[#2e2e2e] rounded-lg shadow-lg max-w-[800px] max-h-[600px] p-2">
            <SetUpWindow 
                onClose={handleCloseSetUpWindow}
                onSave={() => setSystemPromptToLocalStorage()}
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
                isMemoryOn={isMemoryOn}
                setIsMemoryOn={setIsMemoryOn}
            />
        </div>
    </div>
)}
      <div className='flex flex-col gap-4 fixed top-4 right-4'>
        <div className="relative flex items-center group">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
            onClick={() => window.open('https://patreon.com/abdibrokhim', '_blank')}
            >
            <FontAwesomeIcon icon={faCoffee} />
          </button>
          <span className="absolute w-[80px] text-xs right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md bg-[#eeeeee] text-black px-2 py-1 before:content-[''] before:absolute before:left-full before:top-1/2 before:transform before:-translate-y-1/2 before:border-4 before:border-transparent before:border-l-[#eeeeee]">
            Support
          </span>
        </div>
        <div className="relative flex items-center group">
          <button
            onClick={() => window.open('https://github.com/abdibrokhim/', '_blank')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
            >
            <FontAwesomeIcon icon={faGithub} />
          </button>
          <span className="absolute w-[100px] text-xs right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md bg-[#eeeeee] text-black px-2 py-1 before:content-[''] before:absolute before:left-full before:top-1/2 before:transform before:-translate-y-1/2 before:border-4 before:border-transparent before:border-l-[#eeeeee]">
            Open Source
          </span>
        </div>
        <div className="relative flex items-center group">
          <button
            onClick={() => window.open('https://linkedin.com/in/abdibrokhim', '_blank')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeee] text-black shadow cursor-pointer "
            >
            <FontAwesomeIcon icon={faLinkedin} />
          </button>
            <span className="absolute w-[80px] text-xs right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md bg-[#eeeeee] text-black px-2 py-1 before:content-[''] before:absolute before:left-full before:top-1/2 before:transform before:-translate-y-1/2 before:border-4 before:border-transparent before:border-l-[#eeeeee]">
            LinkedIn
          </span>
        </div>
      </div>
      <div className="w-full lg:max-w-5xl px-16 lg:px-0 mx-auto">
        <div className="mb-32 w-full lg:text-left overflow-auto">
          <div className="overflow-y-auto flex-1 p-4">
          {messages.map((message, index) => (
  <div
    key={index}
    className={`p-4 mb-2 rounded-lg ${
      message.sender === 'bot' ? 'bg-[#1e1e1e]' : message.type === 'reply' ? 'bg-none' : 'bg-[#2e2e2e]'
    } text-white max-w-full`}
  >
    {message.type === 'reply' && (
      <div className="text-xs p-2 mb-2 truncate">
        <span className='text-sm'>Replying:</span> {message.text}
      </div>
    )}

    <ReactMarkdown
      components={{
        a: ({ node, ...props }) => (
          <a className="text-blue-800 cursor-pointer" {...props} />
        ),
      }}
    >
      {message.type === 'reply' ? null : message.text}
    </ReactMarkdown>
  </div>
))}

          </div>
        </div>
      </div>
      {replying && (
        <div className="w-[80%] lg:max-w-5xl mx-auto flex items-center p-2 mb-4 fixed bottom-[60px] left-0 right-0 shadow-lg gap-4 rounded-full">
          <div className="flex items-center gap-4 p-1 ml-10">
            <div className="flex items-center text-white">
              <span className="ml-1 bg-[#4e4e4e] px-4 py-2 rounded text-ellipsis overflow-hidden">
                {replyText}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="w-[80%] lg:max-w-5xl mx-auto flex items-center p-2 mb-8 fixed bottom-0 left-0 right-0 shadow-lg gap-4 bg-[#2e2e2e] rounded-full">
        <button
          disabled={loading}
          onClick={() => setShowFileWindow(!showFileWindow)}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-[#4e4e4e] text-black shadow ${
            loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {!loading 
            ? <FontAwesomeIcon icon={faAdd} />
            : <span className='flex justify-center items-center text-white'>{loader()}</span>
          }
        </button>
        <textarea
          tabIndex={0}
          ref={textareaRef}
          className="flex-1 resize-none border-none focus:ring-0 outline-none bg-transparent text-white"
          placeholder="Type your message..."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          style={{ minHeight: '24px', maxHeight: '128px' }}
        />
        <button
          disabled={loading || input === ''}
          onClick={!replying ? handleSendMessage : chatCompletion}
          className={`flex items-center justify-center w-10 h-10 rounded-full shadow ${
            loading || input === '' ? 'cursor-not-allowed bg-[#4e4e4e] text-black'  : 'cursor-pointer bg-[#eeeeee] text-black'}`}
        >
          {!loading 
            ? <FontAwesomeIcon icon={faArrowUp} />
            : <span className='flex justify-center items-center text-white'>{loader()}</span>
          }
        </button>
        {showFileWindow && (
          <div className="absolute left-0 top-[-150px] mt-8 w-72 p-2 bg-[#2e2e2e] text-white text-sm rounded shadow-md z-50">
            <div>
              <div className='flex gap-3 p-2 items-center'>
                <FontAwesomeIcon icon={faThumbTack} />
                <div className="flex items-center">
                  Current file: 
                  {selectedFile ? (
                    <>
                      {processing 
                        ? <span className='ml-8 flex justify-center items-center'>{loader()}</span>
                        : validated 
                          ? <span className='ml-1 bg-[#4e4e4e] p-1 rounded'>{getFileName()}</span>
                          : 'Error'
                      }
                    </>
                  ) : (<span className='ml-8'>...</span>)}
                </div>
              </div>
              <div className='flex m-auto items-center justify-center w-64 h-[1px] bg-[#4e4e4e]'></div>
              <label
                htmlFor="fileInput"
                className="mt-2 flex p-2 items-center gap-3 rounded-md hover:bg-[#4e4e4e] transition-colors duration-200 text-white cursor-pointer text-sm flex-shrink-0"
              >
                <FontAwesomeIcon icon={faFilePdf} />
                <span>Upload from computer</span>
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TellAsStoryButton({ selectedText, replyCallback } : { selectedText: string, replyCallback?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  console.log('selectedText:', selectedText);

  const handleClick = async () => {
    console.log('Reading aloud...');
    if (selectedText.length > 100) {
      setLoading(true);
      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: selectedText }),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const blob = await response.blob();

        // Save to IndexedDB and play
        await saveAndPlayAudio(blob);
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching the audio.');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please select text longer than 200 characters.');
    }
  };
  
  const loader = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <circle cx={4} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale0" attributeName="r" begin="0;svgSpinners3DotsScale1.end-0.25s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={12} cy={12} r={3} fill="currentColor">
        <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.6s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={20} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale1" attributeName="r" begin="svgSpinners3DotsScale0.end-0.45s" dur="0.75s" values="3;.2;3" />
      </circle>
    </svg>
  );

  return (
    <div className='flex flex-row gap-2 p-2 bg-[#2e2e2e] rounded-md shadow-md'>
      <button onClick={handleClick} disabled={loading} className='py-2 px-4 bg-[#eeeeee] text-black rounded-md hover:bg-[#2e2e2e] hover:text-white cursor-pointer hover:border-[#eeeeee] hover:border border'>
        {loading ? loader() : 'Read aloud'}
      </button>
      <button onClick={replyCallback} disabled={replying} className='py-2 px-4 bg-[#eeeeee] text-black rounded-md hover:bg-[#2e2e2e] hover:text-white cursor-pointer hover:border-[#eeeeee] hover:border border'>
        {replying ? loader() : 'Reply'}
      </button>
    </div>
  );
}
