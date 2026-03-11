from datetime import datetime, timedelta
from typing import List, Optional
from dateutil.rrule import rrulestr, rrule, DAILY, WEEKLY, MONTHLY, YEARLY

def parse_rrule(rrule_string: str, dtstart: datetime, until: Optional[datetime] = None) -> List[datetime]:
    try:
        if until is None:
            until = dtstart + timedelta(days=365)
        
        rule = rrulestr(rrule_string, dtstart=dtstart)
        occurrences = list(rule.between(dtstart, until, inc=True))
        
        return occurrences[:100]
    except Exception as e:
        raise ValueError(f"Invalid RRULE: {e}")

def create_rrule_string(
    frequency: str,
    interval: int = 1,
    count: Optional[int] = None,
    until: Optional[datetime] = None,
    byweekday: Optional[List[int]] = None,
    bymonthday: Optional[int] = None
) -> str:
    freq_map = {
        "daily": DAILY,
        "weekly": WEEKLY,
        "monthly": MONTHLY,
        "yearly": YEARLY
    }
    
    if frequency.lower() not in freq_map:
        raise ValueError(f"Invalid frequency: {frequency}")
    
    params = {
        "freq": freq_map[frequency.lower()],
        "interval": interval
    }
    
    if count:
        params["count"] = count
    if until:
        params["until"] = until
    if byweekday:
        params["byweekday"] = byweekday
    if bymonthday:
        params["bymonthday"] = bymonthday
    
    rule = rrule(**params)
    return str(rule).replace("RRULE:", "")

def expand_recurring_task(
    task_start_date: datetime,
    rrule_string: str,
    range_start: datetime,
    range_end: datetime
) -> List[datetime]:
    try:
        rule = rrulestr(rrule_string, dtstart=task_start_date)
        occurrences = list(rule.between(range_start, range_end, inc=True))
        
        return occurrences
    except Exception:
        return []

def get_next_occurrence(task_start_date: datetime, rrule_string: str) -> Optional[datetime]:
    try:
        rule = rrulestr(rrule_string, dtstart=task_start_date)
        now = datetime.now()
        next_date = rule.after(now, inc=False)
        
        return next_date
    except Exception:
        return None
