"use client"

import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision"
import { useEffect, useRef, useState, useCallback } from "react"
import { calculateAngle, PoseLandmarkIds, type Landmark, type AnglesObjectType} from '../utils/angleCalculations'

export default function MotionStudio() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isWebcamRunning, setIsWebcamRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null)
  const lastVideoTime = useRef<number>(-1)
  const animationFrameId = useRef<number | null>(null);
  // ('user' = 전면, 'environment' = 후면)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');


  const runningMode = "VIDEO"

  // 각도 계산 변수 추가
  const [angles, setAngles] = useState<AnglesObjectType>({
    leftElbow: null,
    rightElbow: null,
    leftShoulder: null,
    rightShoulder: null,
    leftKnee: null,
    rightKnee: null,
    leftHip: null,
    rightHip: null,
  })

  // Pose Landmarker 초기화
  useEffect(() => {
    const initializePoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )
        
        const newPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "models/pose_landmarker_full.task",
            delegate: "GPU"
          },
          runningMode,
          numPoses: 2,
          minPoseDetectionConfidence: 0.7,
          minPosePresenceConfidence: 0.7,
          minTrackingConfidence: 0.7,
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
        stopWebcam()
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

    console.log('[RenderLoop] Called. isWebcamRunning', isWebcamRunning, 'PoseLandmarker Ready', !!poseLandmarker)

    if (!isWebcamRunning || !videoRef.current || !canvasRef.current || !poseLandmarker) {
      console.log('[RenderLoop] Early return. Conditions not met.');

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
      }
      return;
    }

	const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    console.log('[RenderLoop] No canvas context. Requesting next frame.');
		animationFrameId.current = requestAnimationFrame(renderLoop)
		return
	}
	
	const currentTime = video.currentTime * 1000 // 초 → 밀리초 변환

	if (video.readyState >= 2 && currentTime !== lastVideoTime.current) {
		// 마이크로초 단위 타임스탬프 생성 (MediaPipe 요구사항)
		const timestamp = Math.floor(performance.now() * 1000) 

    try {
      const results = poseLandmarker.detectForVideo(video, timestamp)
      
      if (!results || !results.landmarks || results.landmarks.length === 0) {
        console.log('[RenderLoop] No landmarks detected in this frame.')
      }
      // 캔버스 초기화
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const newAngles: AnglesObjectType = {
      leftElbow: null, rightElbow:null,
      leftShoulder: null, rightShoulder: null,
      leftKnee: null, rightKnee: null,
      leftHip: null, rightHip: null,
    }

  // 랜드마크 렌더링
  if (results.landmarks && results.landmarks.length > 0) {
    
    // 첫 인식체의 랜드마크 각도 계산
    const detectedPoseLandmarks = results.landmarks[0] as Landmark[];

    // 랜드마크 각도 계산 시작
    const p = PoseLandmarkIds;

    const leftShoulderPt = detectedPoseLandmarks[p.LEFT_SHOULDER]
    const rightShoulderPt = detectedPoseLandmarks[p.RIGHT_SHOULDER]
    const leftElbowPt = detectedPoseLandmarks[p.LEFT_ELBOW]
    const rightElbowPt = detectedPoseLandmarks[p.RIGHT_ELBOW]
    const leftWristPt = detectedPoseLandmarks[p.LEFT_WRIST]
    const rightWristPt = detectedPoseLandmarks[p.RIGHT_WRIST]
    const leftHipPt = detectedPoseLandmarks[p.LEFT_HIP]
    const rightHipPt = detectedPoseLandmarks[p.RIGHT_HIP]
    const leftKneePt = detectedPoseLandmarks[p.LEFT_KNEE]
    const rightKneePt = detectedPoseLandmarks[p.RIGHT_KNEE]
    const leftAnklePt = detectedPoseLandmarks[p.LEFT_ANKLE]
    const rightAnklePt = detectedPoseLandmarks[p.RIGHT_ANKLE]

    // 팔꿈치
    if (leftShoulderPt && leftElbowPt && leftWristPt){
      newAngles.leftElbow = calculateAngle(leftShoulderPt, leftElbowPt, leftWristPt);
    }
    if (rightShoulderPt && rightElbowPt && rightWristPt){
      newAngles.rightElbow = calculateAngle(rightShoulderPt, rightElbowPt, rightWristPt);
    }

    // 어깨
    if (leftHipPt && leftShoulderPt && leftElbowPt){
      newAngles.leftShoulder = calculateAngle(leftHipPt, leftShoulderPt, leftElbowPt);
    }
    if (rightHipPt && rightShoulderPt && rightElbowPt){
      newAngles.rightShoulder = calculateAngle(rightHipPt, rightShoulderPt, rightElbowPt);
    }

    // 무릎
    if (leftHipPt && leftKneePt && leftAnklePt){
      newAngles.leftKnee = calculateAngle(leftHipPt, leftKneePt, leftAnklePt);
    }
    if (rightHipPt && rightKneePt && rightAnklePt){
      newAngles.rightKnee = calculateAngle(rightHipPt, rightKneePt, rightAnklePt);
    }

    // 엉덩이
    if (leftShoulderPt && leftHipPt && leftKneePt){
      newAngles.leftHip = calculateAngle(leftShoulderPt, leftHipPt, leftKneePt);
    }
    if (rightShoulderPt && rightHipPt && rightKneePt){
      newAngles.rightHip = calculateAngle(rightShoulderPt, rightHipPt, rightKneePt);
    }

    const drawingUtils = new DrawingUtils(ctx)
    results.landmarks.forEach(landmarks => {
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
			color: "#FFFFFF",
			lineWidth: 3,
      })
  
      drawingUtils.drawLandmarks(landmarks, {
			color: "#FFFFFF",
      fillColor: "#000000",
			lineWidth: 2,
			radius: 5,
      })
      })
      }
      
      setAngles(newAngles)

      ctx.restore()
      lastVideoTime.current = currentTime

    } catch (err) {
    console.error("렌더링 중 오류 발생:", err)
    // 에러 발생 시 각도 초기화
    setAngles({ leftElbow: null, rightElbow: null, leftShoulder: null, rightShoulder: null, leftKnee: null, rightKnee: null, leftHip: null, rightHip: null })
	}}
    
    animationFrameId.current = requestAnimationFrame(renderLoop);
  }, [poseLandmarker, isWebcamRunning])

  useEffect(() => {
    if (isWebcamRunning && poseLandmarker) {
      console.log("Starting render loop");
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(renderLoop);
    } else {
      console.log("Stopping render loop");
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        console.log("clean up render loop")
      }
    }
  }, [isWebcamRunning, poseLandmarker, renderLoop])

  const stopWebcam = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamRunning(false);
    console.log("Webcam stopped");
  };



  const startWebcam = async (mode: 'user' | 'environment') => {
    stopWebcam();
    try {
      const constraints = {
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 60 }, 
          facingMode: mode
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!videoRef.current || !canvasRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return;
      }

      videoRef.current.srcObject = stream

      videoRef.current.onloadedmetadata = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        console.log(`Canvas size set : ${canvasRef.current.width} x ${canvasRef.current.height}`)
        
        try {
          await videoRef.current.play()
          setIsWebcamRunning(true)

          setError(null);
        } catch (playError) {
          console.error("Video play error", playError)
          setError("비디오 재생 실패")
          stopWebcam()
        }
      };

      videoRef.current.onerror = (e) => {
        console.error("Vdieo element error", e);
        setError("비디오 로딩 중 오류 발생");
        stopWebcam()
      }
      
    } catch (err) {
      setError("웹캠 접근 권한이 필요합니다")
      setIsWebcamRunning(false)
    }
  }

    // 웹캠 시작/정지
  const toggleWebcam = async () => {
    if (isLoading || !poseLandmarker) return;
    if (isWebcamRunning) {
      stopWebcam()
    } else {
      await startWebcam(facingMode)
    }
  }

  const switchCameraFacingMode = async () => {
    if (isLoading || !poseLandmarker) return; 

    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);

    // 웹캠이 실행 중이었다면 즉시 새로운 모드로 다시 시작
    if (isWebcamRunning) {
      console.log(`Switching camera to: ${newMode}`);
      await startWebcam(newMode);
    }
  };


  return (
  <div className="w-full flex flex-col items-center">
    <h1 className="text-2xl font-bold mb-6 text-gray-800">
      Motion Detection App
    </h1>

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
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-x-3">
        <button
          onClick={toggleWebcam}
          disabled={isLoading || !poseLandmarker}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-lg transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : isWebcamRunning ? 'Stop Camera' : 'Start Camera'}
        </button>

        
      </div>
      {/* 카메라 전환 버튼 (웹캠 실행 중일 때만 표시) */}
      {isWebcamRunning && (
          <button
            onClick={switchCameraFacingMode}
            className="absolute bottom-5 right-5 z-10 p-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out"
            title="Switch Camera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        )}
      {/* 오류 메시지 */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 bg-opacity-90 text-white text-sm px-4 py-2 rounded-md shadow-lg z-20">
          <span>Error: {error}</span>
        </div>
      )}
    </div>
    
      
       {/* 각도 표시 UI */}
      {isWebcamRunning && (
        <div className="w-full max-w-2xl mt-4 bg-slate-800 text-white p-5 rounded-lg shadow-xl">
          <h3 className="text-lg font-semibold mb-3 text-center">각도 계산</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm"> 
          <div className="flex flex-col items-start space-y-1">
              {angles.rightShoulder !== null && !isNaN(angles.rightShoulder) && <p>R. Shoulder: {angles.rightShoulder.toFixed(0)}°</p>}
              {angles.rightElbow !== null && !isNaN(angles.rightElbow) && <p>R. Elbow: {angles.rightElbow.toFixed(0)}°</p>}
              {angles.rightKnee !== null && !isNaN(angles.rightKnee) && <p>R. Knee: {angles.rightKnee.toFixed(0)}°</p>}
              {angles.rightHip !== null && !isNaN(angles.rightHip) && <p>R. Hip: {angles.rightHip.toFixed(0)}°</p>}
            </div>
            <div className="flex flex-col items-start space-y-1">
              {angles.leftShoulder !== null && !isNaN(angles.leftShoulder) && <p>L. Shoulder: {angles.leftShoulder.toFixed(0)}°</p>}
              {angles.leftElbow !== null && !isNaN(angles.leftElbow) && <p>L. Elbow: {angles.leftElbow.toFixed(0)}°</p>}
              {angles.leftKnee !== null && !isNaN(angles.leftKnee) && <p>L. Knee: {angles.leftKnee.toFixed(0)}°</p>}
              {angles.leftHip !== null && !isNaN(angles.leftHip) && <p>L. Hip: {angles.leftHip.toFixed(0)}°</p>}
            </div>
          </div>
        </div>
      )}
  </div>
  )
}
