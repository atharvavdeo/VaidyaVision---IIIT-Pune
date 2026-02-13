"""
FastAPI server for VaidyaVision ML inference.
Uses the real inference pipeline with GradCAM and MC Dropout.
"""

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import time
import base64
import traceback

from inference import load_models, predict as run_inference

app = FastAPI(title="VaidyaVision ML Service")

# Allow all origins for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure heatmap output directory exists
HEATMAP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "heatmaps")
os.makedirs(HEATMAP_DIR, exist_ok=True)


@app.on_event("startup")
def startup():
    """Load all models at server startup."""
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    load_models(models_dir)
    print("[INFO] ML Service ready.")


@app.get("/")
def health_check():
    return {"status": "online", "service": "VaidyaVision ML"}


@app.post("/predict")
async def predict_endpoint(
    file: UploadFile = File(...),
    modality: str = Form(None),
):
    """
    Run full inference pipeline:
    1. Route to correct expert (or use forced modality)
    2. MC Dropout uncertainty estimation
    3. GradCAM heatmap generation
    4. Save heatmap to public/heatmaps/ and return URL
    """
    try:
        contents = await file.read()

        # Run the real inference pipeline
        result = run_inference(
            image_bytes=contents,
            force_modality=modality if modality and modality in ["brain", "lung", "skin", "ecg"] else None,
            mc_samples=25,
            uncertainty_threshold=0.15,
        )

        # Save heatmap to disk as a file
        heatmap_url = None
        if "heatmap_base64" in result and result["heatmap_base64"]:
            heatmap_filename = f"heatmap_{int(time.time() * 1000)}.png"
            heatmap_path = os.path.join(HEATMAP_DIR, heatmap_filename)

            heatmap_bytes = base64.b64decode(result["heatmap_base64"])
            with open(heatmap_path, "wb") as f:
                f.write(heatmap_bytes)

            heatmap_url = f"/heatmaps/{heatmap_filename}"
            # Remove base64 from response (too large for JSON)
            del result["heatmap_base64"]

        result["heatmap_url"] = heatmap_url

        return result

    except Exception as e:
        traceback.print_exc()
        return {
            "status": "ERROR",
            "diagnosis": "Analysis Failed",
            "confidence": 0,
            "uncertainty": 1.0,
            "heatmap_url": None,
            "error": str(e),
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
