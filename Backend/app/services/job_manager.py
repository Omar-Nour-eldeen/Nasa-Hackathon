import uuid
import time
import threading
from concurrent.futures import ThreadPoolExecutor

class JobManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(JobManager, cls).__new__(cls)
                cls._instance._jobs = {}
                cls._instance._executor = ThreadPoolExecutor(max_workers=4)
        return cls._instance

    def submit_job(self, job_type: str, target_func, *args, **kwargs) -> str:
        job_id = str(uuid.uuid4())[:8]
        job_record = {
            "id": job_id,
            "type": job_type,
            "status": "queued",  # queued, running, completed, failed, cancelled
            "progress": 0,       # 0 to 100
            "logs": [f"[{time.strftime('%X')}] Job created."],
            "result": None,
            "error": None,
            "created_at": time.time(),
            "updated_at": time.time(),
            "_cancel_requested": False
        }
        self._jobs[job_id] = job_record

        def runner():
            job_record["status"] = "running"
            job_record["updated_at"] = time.time()
            job_record["logs"].append(f"[{time.strftime('%X')}] Job execution started.")
            try:
                # Target func can accept job_record or helper to update progress/logs
                result = target_func(job_record, *args, **kwargs)
                if not job_record["_cancel_requested"]:
                    job_record["status"] = "completed"
                    job_record["progress"] = 100
                    job_record["result"] = result
                    job_record["logs"].append(f"[{time.strftime('%X')}] Job completed successfully.")
                else:
                    job_record["status"] = "cancelled"
                    job_record["logs"].append(f"[{time.strftime('%X')}] Job was cancelled.")
            except Exception as e:
                job_record["status"] = "failed"
                job_record["error"] = str(e)
                job_record["logs"].append(f"[{time.strftime('%X')}] Job failed with error: {str(e)}")
            finally:
                job_record["updated_at"] = time.time()

        self._executor.submit(runner)
        return job_id

    def get_job(self, job_id: str):
        job = self._jobs.get(job_id)
        if not job:
            return None
        # Return a copy without internal flags
        return {k: v for k, v in job.items() if not k.startswith("_")}

    def get_all_jobs(self):
        return [self.get_job(jid) for jid in self._jobs]

    def cancel_job(self, job_id: str):
        job = self._jobs.get(job_id)
        if not job:
            return False
        if job["status"] in ("queued", "running"):
            job["_cancel_requested"] = True
            job["status"] = "cancelling"
            job["logs"].append(f"[{time.strftime('%X')}] Cancellation requested.")
            return True
        return False

# Global singleton
job_manager = JobManager()

