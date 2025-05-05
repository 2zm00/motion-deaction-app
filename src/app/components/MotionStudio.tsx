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

  const videoHeight = 360
  const videoWidth = 480
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
          outputSegmentationMasks: true,
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

  // 렌더링 루프
  const renderLoop = useCallback(() => {
    if (!videoRef.current || !poseLandmarker || !canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) {
		requestAnimationFrame(renderLoop)
		return
	}
	
	const currentTime = videoRef.current.currentTime * 1000 // 초 → 밀리초 변환
	if (currentTime !== lastVideoTime.current) {
		// 마이크로초 단위 타임스탬프 생성 (MediaPipe 요구사항)
		const timestamp = Math.floor(performance.now() * 1000) 

    try {
      const results = poseLandmarker.detectForVideo(videoRef.current, timestamp)
      
      // 캔버스 초기화
      ctx.save()
      ctx.clearRect(0, 0, videoWidth, videoHeight)
	  ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight)



      // 랜드마크 렌더링
      if (results.landmarks) {
        const drawingUtils = new DrawingUtils(ctx)
        results.landmarks.forEach(landmarks => {
          drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
			color: "#00FF00",
			lineWidth: 2,
		  })
  
		  drawingUtils.drawLandmarks(landmarks, {
			color: "#FF0000",
			lineWidth: 1,
			radius: 3,
		  })
        })
      }

      ctx.restore()
      lastVideoTime.current = videoRef.current.currentTime
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
          width: { ideal: videoWidth },
          height: { ideal: videoHeight },
          frameRate: { ideal: 30 } 
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
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video 
        ref={videoRef}
        width={videoWidth}
        height={videoHeight}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />
      
      <canvas 
        ref={canvasRef}
        width={videoWidth}
        height={videoHeight}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 제어 버튼 */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-10">
        <button
          onClick={toggleWebcam}
          disabled={isLoading}
          className={`px-4 py-2 ${
            isWebcamRunning 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white font-semibold rounded-md shadow-lg transition duration-150`}
        >
          {isLoading ? '로딩 중...' : isWebcamRunning ? '중지' : '시작'}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
