import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMemo } from "react";

import { BlurFilter, TextStyle } from "pixi.js";
import { Stage, Container, Sprite, Text, Graphics } from "@pixi/react";

const Arena = () => {
  const [zoomLevel, setZoomLevel] = useState(0.3);
  const canvasRef = useRef<any>(null);
  const wsRef = useRef<any>(null);
  const divRef = useRef<any>(null);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [users, setUsers] = useState(new Map());
  const [params, setParams] = useState({ token: "", spaceId: "" });
  const scale = 32;
  const lastUpdateTimeRef = useRef<number>(Date.now());

  


  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2)); // Max zoom level: 2
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.1)); // Min zoom level: 0.1
  };



  // Initialize WebSocket connection and handle URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token") || "";
    const spaceId = urlParams.get("spaceId") || "";
    setParams({ token, spaceId });

    // Initialize WebSocket
    wsRef.current = new WebSocket("ws://localhost:8080"); // Replace with your WS_URL

    wsRef.current.onopen = () => {
      // Join the space once connected
      wsRef.current.send(
        JSON.stringify({
          type: "join",
          payload: {
            spaceId,
            token,
          },
        })
      );
    };

    wsRef.current.onmessage = (event: any) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case "space-joined":
        // Initialize current user position and other users
        console.log("set");
        console.log({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId,
        });
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId,
        });

        // Initialize other users from the payload
        const userMap = new Map();
        message.payload.users.forEach((user: any) => {
          // console.log(user)
          userMap.set(user.userId, user);
          // console.log("inside all users " + user.userId)
        });
        setUsers(userMap);
        // console.log("inside space joined "+ [...users] )
        break;

      case "user-joined":
        setUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId,
          });
          return newUsers;
        });
        break;

      case "movement":
        console.log("inside movement");
        console.log(message.payload);
        setUsers((prev) => {
          const newUsers = new Map(prev);
          const user = newUsers.get(message.payload.userId);
          console.log("inside movement" + " user " + user);
          if (user) {
            user.x = message.payload.x;

            user.y = message.payload.y;
            console.log("inside movement" + user.x + " " + user.y);
            newUsers.set(message.payload.userId, user);
          }
          return newUsers;
        });
        break;

      // case "movement-accepted":
      //   setCurrentUser({
      //     x: message.payload.x,
      //     y: message.payload.y,
      //     userId: message.payload.userId,
      //   });
      //   break;

      case "movement-rejected":
        // Reset current user position if movement was rejected
        setCurrentUser((prev: any) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y,
        }));
        break;

      case "user-left":
        setUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  };

  // Handle user movement
  const handleMove = (newX: any, newY: any) => {
    if (!currentUser) return;


    setCurrentUser((prev: any) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
    // Send movement request
    wsRef.current.send(
      JSON.stringify({
        type: "move",
        payload: {
          x: newX,
          y: newY,
          userId: currentUser.userId,
        },
      })
    );
  };

  // Draw the arena

  // useEffect(() => {
  //   console.log("render")
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   console.log("below render")

  //   const ctx = canvas.getContext('2d');
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);

  //   // Draw grid
  //   ctx.strokeStyle = '#eee';
  //   for (let i = 0; i < canvas.width; i += 50) {
  //     ctx.beginPath();
  //     ctx.moveTo(i, 0);
  //     ctx.lineTo(i, canvas.height);
  //     ctx.stroke();
  //   }
  //   for (let i = 0; i < canvas.height; i += 50) {
  //     ctx.beginPath();
  //     ctx.moveTo(0, i);
  //     ctx.lineTo(canvas.width, i);
  //     ctx.stroke();
  //   }

  //   console.log("before curerntusert")
  //   console.log(currentUser)
  //  // Draw current user
  //   if (currentUser && currentUser.x) {
  //       console.log("drawing myself")
  //       console.log(currentUser)
  //     ctx.beginPath();
  //     ctx.fillStyle = '#FF6B6B';
  //     ctx.arc(currentUser.x * 50, currentUser.y * 50, 20, 0, Math.PI * 2);
  //     ctx.fill();
  //     ctx.fillStyle = '#000';
  //     ctx.font = '14px Arial';
  //     ctx.textAlign = 'center';
  //     ctx.fillText('You', currentUser.x * 50, currentUser.y * 50 + 40);
  //   }

  //   // Draw other users
  //   users.forEach(user => {
  //   if (!user.x) {
  //       return
  //   }
  //   console.log("drawing other user")
  //   console.log(user)
  //     ctx.beginPath();
  //     ctx.fillStyle = '#4ECDC4';
  //     ctx.arc(user.x * 50, user.y * 50, 20, 0, Math.PI * 2);
  //     ctx.fill();
  //     ctx.fillStyle = '#000';
  //     ctx.font = '14px Arial';
  //     ctx.textAlign = 'center';
  //     ctx.fillText(`User ${user.userId}`, user.x * 50, user.y * 50 + 40);
  //   });
  // }, [currentUser, users]);

  const Grid = ({ width, height }) => {
    const drawGrid = useCallback(
      (g) => {
        g.clear();
        g.lineStyle(1, 0xeeeeee);

        // Draw vertical lines
        for (let i = 0; i <= width; i += scale) {
          g.moveTo(i, 0);
          g.lineTo(i, height);
        }

        // Draw horizontal lines
        for (let i = 0; i <= height; i += scale) {
          g.moveTo(0, i);
          g.lineTo(width, i);
        }
      },
      [width, height,scale]
    );

    return <Graphics draw={drawGrid} />;
  };

  const User = ({ x, y, color, name }) => {
    // console.log("drawing users")
    // console.log(users)
    
    const drawUser = useCallback(
      (g) => {
        g.clear();
        g.beginFill(color);
        g.drawCircle(x * scale, y * scale, scale * 0.8);
        console.log(x * scale, y * scale)
        g.endFill();
      },
      
      [x, y, color]
    );

    const textStyle = new TextStyle({
      fontSize: 14,
      fill: "#000000",
    });


    return (
      <Container>
        <Graphics draw={drawUser} />
        <Text
          text={name}
          x={x * scale}
          y={y * scale + 45}
          style={textStyle}
          anchor={0.5}
        />
      </Container>
    );
  };

  const handleKeyDown = (e: any) => {
    if (!currentUser) return;

    const { x, y } = currentUser;


  const currentTime = Date.now();
  const deltaTime = (currentTime - lastUpdateTimeRef.current) / 1000; // in seconds
  lastUpdateTimeRef.current = currentTime;

  // console.log(`DeltaTime: ${deltaTime}s`);

  const movementSpeed = 1; // units per second
  const movementDistance = movementSpeed * deltaTime; 
    switch (e.key) {
      case "ArrowUp":
        handleMove(x, y - 1);
        break;
      case "ArrowDown":
        handleMove(x, y + 1);
        break;
      case "ArrowLeft":
        handleMove(x - 1, y);
        break;
      case "ArrowRight":
        handleMove(x + 1, y);
        break;
    }
  };
  useEffect(() => {
    if (divRef.current) {
      divRef.current.focus();
    }

  const handleFrameUpdate = () => {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTimeRef.current) / 1000;
    lastUpdateTimeRef.current = currentTime;

    // console.log(`Frame DeltaTime: ${deltaTime}s`);
    requestAnimationFrame(handleFrameUpdate);
  };

  requestAnimationFrame(handleFrameUpdate);
  }, []);

  return (
    <div
      className="h-fit w-fit m-4"
      ref={divRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onClick={() => divRef.current.focus()}
    >
      <h1 className="text-2xl font-bold mb-4">Arena</h1>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Token: {params.token}</p>
        <p className="text-sm text-gray-600">Space ID: {params.spaceId}</p>
       
        <p className="text-sm text-gray-600">
          Connected Users: {users.size + (currentUser ? 1 : 0)}
        </p>
      </div>
      <div className="controls mb-4">
        <button onClick={handleZoomIn} className="px-4 py-2 bg-blue-500 text-white rounded">
          Zoom In
        </button>
        <button onClick={handleZoomOut} className="px-4 py-2 bg-blue-500 text-white rounded ml-2">
          Zoom Out
        </button>
        <p className="text-sm text-gray-600 mt-2">Zoom Level: {Math.round(zoomLevel * 100)}%</p>
      </div>
      <div className="border rounded-lg fixed overflow-hidden">
        {/* <canvas
            ref={canvasRef}
            width={2000}
            height={2000}
            className="bg-white"
          /> */}
        <Stage
          width={3200}
          height={3200}
          options={{ backgroundColor: 0xffffff }}
        >
          <Container scale={zoomLevel}>
          <Grid width={3200} height={3200} />

          {/* Draw current user */}
          {currentUser?.x && (
            <User
              x={currentUser.x}
              y={currentUser.y}
              color={0xff6b6b}
              name="You"
            />
          )}

          {/* Draw other users */}
          {[...users].map(
            ([userId, user]) =>
              user.x && (
                <User
                  key={user.userId}
                  x={user.x}
                  y={user.y}
                  color={0x4ecdc4}
                  name={`User ${user.userId}`}
                />
              )
          )}
          </Container>
        </Stage>
      </div>

      <p className="mt-2 text-xl text-red-500">
        Use arrow keys to move your avatar
      </p>
    </div>
  );
};

export default Arena;
