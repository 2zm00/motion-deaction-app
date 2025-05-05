"use client"

import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision"
import { useEffect, useRef, useState, useCallback } from "react"

export default function MotionStudio() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isWebcamRunning, setIsWebcamRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null)
  const lastVideoTime = useRef<number>(-1)

  const runningMode = "VIDEO"

  // Pose Landmarker 초기화
  useEffect(() => {
    const initializePoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )
        
        const newPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "models/pose_landmarker_heavy.task",
            delegate: "GPU"
          },
          runningMode,
          numPoses: 2,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        })

        setPoseLandmarker(newPoseLandmarker)
        setIsLoading(false)
      } catch (err) {
        setError("모델 초기화 중 오류 발생")
        setIsLoading(false)
      }
    }

    initializePoseLandmarker()
    
    return () => {
      if (poseLandmarker) {
        poseLandmarker.close()
      }
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const handleMetadataLoaded = () => {
      // 실제 비디오 스트림의 크기를 가져와 캔버스 속성(attribute)으로 설정
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    video.addEventListener('loadedmetadata', handleMetadataLoaded);

    return () => {
      video.removeEventListener('loadedmetadata', handleMetadataLoaded);
    };
  }, []);

  // 렌더링 루프
  const renderLoop = useCallback(() => {
	const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = poseLandmarker;

    if (!video || !landmarker || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) {
		requestAnimationFrame(renderLoop)
		return
	}
	
	const currentTime = video.currentTime * 1000 // 초 → 밀리초 변환
	if (currentTime !== lastVideoTime.current) {
		// 마이크로초 단위 타임스탬프 생성 (MediaPipe 요구사항)
		const timestamp = Math.floor(performance.now() * 1000) 

    try {
      const results = poseLandmarker.detectForVideo(video, timestamp)
      
      // 캔버스 초기화
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
	  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)



      // 랜드마크 렌더링
      if (results.landmarks) {
        const drawingUtils = new DrawingUtils(ctx)
        results.landmarks.forEach(landmarks => {
          drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
			color: "#FFFFFF",
			lineWidth: 5,
		  })
  
		  drawingUtils.drawLandmarks(landmarks, {
			color: "#FFFFFF",
      fillColor: "#000000",
			lineWidth: 3,
			radius: 10,
		  })
        })
      }

      ctx.restore()
      lastVideoTime.current = video.currentTime
    } catch (err) {
	  console.error("렌더링 중 오류 발생:", err)
	}}
    
    requestAnimationFrame(renderLoop)
  }, [poseLandmarker])

  // 웹캠 시작/정지
  const toggleWebcam = async () => {
    if (isWebcamRunning) {
      stopWebcam()
    } else {
      await startWebcam()
    }
  }

  const startWebcam = async () => {
    try {
      const constraints = {
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 60 }, 
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (!videoRef.current) return

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setIsWebcamRunning(true)
      requestAnimationFrame(renderLoop)
      
    } catch (err) {
      setError("웹캠 접근 권한이 필요합니다")
      setIsWebcamRunning(false)
    }
  }

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsWebcamRunning(false)
    }
  }

  return (
    <div className="relative w-full aspect-[9/16] landscape:aspect-video md:aspect-auto bg-black rounded-lg overflow-hidden shadow-lg">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" autoPlay playsInline muted />
      
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />

	{/* 로딩 */}
	{isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-white font-medium">Loading model...</span>
          </div>
        </div>
      )}

      {/* 제어 버튼 */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-10">
        <button
          onClick={toggleWebcam}
          disabled={isLoading || !!error}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-lg transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isWebcamRunning ? "Stop Camera" : "Start Camera"}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-600 bg-opacity-80 text-white p-4 z-20">
          <span>Error: {error}</span>
        </div>
      )}
    </div>
  )
}
