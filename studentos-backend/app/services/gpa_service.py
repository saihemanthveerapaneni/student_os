from typing import List, Dict, Any

# Grade to Points mapping
GRADE_POINTS: Dict[str, float] = {
    'A+': 10.0,
    'A': 9.0,
    'B+': 8.0,
    'B': 7.0,
    'C+': 6.0,
    'C': 5.0,
    'D': 4.0,
    'F': 0.0,
}

GRADES_ORDER = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+']

MARKS_MAP = {
    'F': '< 40% Marks',
    'D': '40-50% Marks',
    'C': '50-60% Marks',
    'C+': '60-70% Marks',
    'B': '70-75% Marks',
    'B+': '75-80% Marks',
    'A': '80-90% Marks',
    'A+': '> 90% Marks',
}

def calculate_sgpa(subjects: List[Dict[str, Any]]) -> float:
    total_credits = 0.0
    total_weighted_points = 0.0

    for subject in subjects:
        credits = float(subject.get("credit_hours", 0.0))
        grade = subject.get("grade", "")
        points = GRADE_POINTS.get(grade)

        if points is not None and credits > 0:
            total_credits += credits
            total_weighted_points += credits * points

    if total_credits == 0.0:
        return 0.0
    return round(total_weighted_points / total_credits, 2)


def calculate_reverse_gpa(target_gpa: float, subjects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    total_credits = sum(float(s.get("credit_hours", 0.0)) for s in subjects)
    if total_credits == 0.0:
        return []

    target_points_needed = target_gpa * total_credits
    accumulated_points = 0.0

    # Sort subjects by credits descending to assign higher requirements to high-credit courses
    sorted_subjects = sorted(subjects, key=lambda x: float(x.get("credit_hours", 0.0)), reverse=True)
    results = {}

    for idx, subject in enumerate(sorted_subjects):
        credits = float(subject.get("credit_hours", 0.0))
        remaining_subjects = sorted_subjects[idx + 1:]
        remaining_credits = sum(float(s.get("credit_hours", 0.0)) for s in remaining_subjects)

        chosen_grade = 'F'
        chosen_marks = MARKS_MAP['F']

        # Greedy search from lowest to highest grade
        for grade in GRADES_ORDER:
            pts = GRADE_POINTS[grade]
            # Max possible points we can get from remaining subjects is assuming they all get A+ (10.0)
            prospective_total = accumulated_points + (credits * pts) + (remaining_credits * 10.0)
            if prospective_total >= target_points_needed:
                chosen_grade = grade
                chosen_marks = MARKS_MAP[grade]
                break

        accumulated_points += credits * GRADE_POINTS[chosen_grade]
        results[subject.get("id", subject.get("name", ""))] = {
            "grade": chosen_grade,
            "marks": chosen_marks
        }

    # Map back to original list order
    output = []
    for s in subjects:
        key = s.get("id", s.get("name", ""))
        output.append({
            **s,
            "required_grade": results.get(key, {}).get("grade", "A"),
            "required_marks": results.get(key, {}).get("marks", "> 80% Marks")
        })

    return output
