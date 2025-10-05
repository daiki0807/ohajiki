import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';

// おはじきコンポーネント
const Ohajiki = ({ marble, onMouseDown, isDragging }) => {
  return (
    <div
      className={`ohajiki ${marble.color} ${isDragging ? 'grabbing' : 'grab'}`}
      style={{ left: marble.x, top: marble.y }}
      onMouseDown={(e) => onMouseDown(e, marble.id)}
    >
    </div>
  );
};

function App() {
  // 1. localStorageから初期状態を読み込む
  const [marbles, setMarbles] = useState(() => {
    try {
      const savedMarbles = localStorage.getItem('ohajiki-marbles');
      const parsed = savedMarbles ? JSON.parse(savedMarbles) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to load marbles from localStorage", error);
      return [];
    }
  });

  // 2. marblesの状態が変更されたらlocalStorageに保存する
  useEffect(() => {
    try {
      localStorage.setItem('ohajiki-marbles', JSON.stringify(marbles));
    } catch (error) {
      console.error("Failed to save marbles to localStorage", error);
    }
  }, [marbles]);

  const workspaceRef = useRef(null);
  const draggingInfo = useRef({
    isDragging: false,
    marbleId: null,
    offsetX: 0,
    offsetY: 0,
  });

  const blueMarblesCount = marbles.filter(m => m.color === 'blue').length;
  const redMarblesCount = marbles.filter(m => m.color === 'red').length;

  // おはじきの追加
  const addMarble = (color) => {
    if (!workspaceRef.current) return;
    const workspaceRect = workspaceRef.current.getBoundingClientRect();
    const marbleSize = 48;
    
    const x = Math.random() * (workspaceRect.width - marbleSize);
    const y = Math.random() * (workspaceRect.height - marbleSize);

    // 3. ID生成方法を変更
    const newMarble = { id: Date.now() + Math.random(), color, x, y };
    setMarbles(prevMarbles => [...prevMarbles, newMarble]);
  };

  // おはじきの削除
  const removeMarble = (color) => {
    setMarbles(prevMarbles => {
      const lastMarbleIndex = prevMarbles.map(m => m.color).lastIndexOf(color);
      if (lastMarbleIndex === -1) return prevMarbles;
      return prevMarbles.filter((_, index) => index !== lastMarbleIndex);
    });
  };

  // ドラッグ開始
  const handleMouseDown = (e, id) => {
    const marble = marbles.find(m => m.id === id);
    if (!marble) return;

    draggingInfo.current = {
      isDragging: true,
      marbleId: id,
      offsetX: e.clientX - marble.x,
      offsetY: e.clientY - marble.y,
    };
    
    // ドラッグ中のちらつきを防ぐ
    e.preventDefault();
  };

  // ドラッグ中
  const handleMouseMove = useCallback((e) => {
    if (!draggingInfo.current.isDragging || !workspaceRef.current) return;

    const { marbleId, offsetX, offsetY } = draggingInfo.current;
    const workspaceRect = workspaceRef.current.getBoundingClientRect();
    const marbleSize = 48;

    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    // ワークスペースの境界内に制限
    newX = Math.max(0, Math.min(newX, workspaceRect.width - marbleSize));
    newY = Math.max(0, Math.min(newY, workspaceRect.height - marbleSize));

    setMarbles(prevMarbles =>
      prevMarbles.map(m =>
        m.id === marbleId ? { ...m, x: newX, y: newY } : m
      )
    );
  }, []);

  // ドラッグ終了
  const handleMouseUp = useCallback(() => {
    draggingInfo.current.isDragging = false;
    draggingInfo.current.marbleId = null;
  }, []);

  useEffect(() => {
    // イベントリスナーをウィンドウに追加
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  return (
    <div className="App">
      <header className="controls">
        <h1>おはじきあそび</h1>
        <div className="control-panel">
          <div className="control-group blue-group">
            <h2>あお</h2>
            <div className="buttons">
              <button onClick={() => addMarble('blue')}>＋</button>
              <button onClick={() => removeMarble('blue')} disabled={blueMarblesCount === 0}>−</button>
            </div>
            <p className="count">かず: {blueMarblesCount}</p>
          </div>
          <div className="total-count">
            <p>ぜんぶで</p>
            <p className="count-number">{marbles.length}</p>
          </div>
          <div className="control-group red-group">
            <h2>あか</h2>
            <div className="buttons">
              <button onClick={() => addMarble('red')}>＋</button>
              <button onClick={() => removeMarble('red')} disabled={redMarblesCount === 0}>−</button>
            </div>
            <p className="count">かず: {redMarblesCount}</p>
          </div>
        </div>
      </header>
      <main className="workspace" ref={workspaceRef}>
        {marbles.map(marble => (
          <Ohajiki
            key={marble.id}
            marble={marble}
            onMouseDown={handleMouseDown}
            isDragging={draggingInfo.current.isDragging && draggingInfo.current.marbleId === marble.id}
          />
        ))}
      </main>
    </div>
  );
}

export default App;