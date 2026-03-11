import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
import pytz

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone=pytz.timezone('Asia/Kolkata'))

job_status = {
    "scheduler_running": False,
    "jobs": {},
    "last_error": None,
    "started_at": None
}

def job_listener(event):
    job_id = event.job_id
    
    if event.exception:
        logger.error(f"Job {job_id} failed with exception: {event.exception}")
        job_status["last_error"] = {
            "job_id": job_id,
            "error": str(event.exception),
            "timestamp": datetime.now().isoformat()
        }
        job_status["jobs"][job_id] = {
            "status": "failed",
            "last_run": datetime.now().isoformat(),
            "error": str(event.exception)
        }
    else:
        logger.info(f"Job {job_id} executed successfully")
        job_status["jobs"][job_id] = {
            "status": "success",
            "last_run": datetime.now().isoformat(),
            "error": None
        }

def init_scheduler():
    logger.info("Initializing APScheduler...")
    
    scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    
    logger.info("Scheduler initialized successfully")

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        job_status["scheduler_running"] = True
        job_status["started_at"] = datetime.now().isoformat()
        logger.info("Scheduler started")
    else:
        logger.warning("Scheduler is already running")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=True)
        job_status["scheduler_running"] = False
        logger.info("Scheduler stopped")
    else:
        logger.warning("Scheduler is not running")

def add_job(func, trigger, job_id, **kwargs):
    try:
        if scheduler.get_job(job_id):
            logger.warning(f"Job {job_id} already exists. Replacing...")
            scheduler.remove_job(job_id)
        
        scheduler.add_job(func, trigger, id=job_id, **kwargs)
        job_status["jobs"][job_id] = {
            "status": "scheduled",
            "last_run": None,
            "error": None
        }
        logger.info(f"Job {job_id} added successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to add job {job_id}: {e}")
        return False

def get_scheduler_status():
    return {
        "scheduler_running": scheduler.running,
        "jobs_count": len(scheduler.get_jobs()),
        "jobs": job_status["jobs"],
        "last_error": job_status["last_error"],
        "started_at": job_status["started_at"],
        "current_time": datetime.now().isoformat()
    }

def remove_job(job_id):
    try:
        scheduler.remove_job(job_id)
        if job_id in job_status["jobs"]:
            del job_status["jobs"][job_id]
        logger.info(f"Job {job_id} removed successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to remove job {job_id}: {e}")
        return False
