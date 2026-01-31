"""
Database module for SOR Automation System
Handles all database queries and connections
"""
from typing import Dict, List, Optional
import pymysql
from .config import config

class DatabaseManager:
    """Manages database connections and queries"""
    
    def __init__(self):
        self.connection = None
        self.config = {
            "host": config.DB_HOST,
            "user": config.DB_USER,
            "password": config.DB_PASSWORD,
            "database": config.DB_NAME,
            "port": config.DB_PORT,
            "cursorclass": pymysql.cursors.DictCursor
        }
    
    def get_connection(self):
        # Always create a fresh connection to avoid stale connection issues
        try:
            if self.connection:
                self.connection.ping(reconnect=True)
        except:
            self.connection = None

        if not self.connection:
            self.connection = pymysql.connect(**self.config)
        return self.connection
    
    def test_connection(self) -> bool:
        try:
            conn = self.get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            print("[OK] Database connected")
            return True
        except Exception as e:
            print(f"[X] Database connection failed: {e}")
            return False
    
    def fetch_learner_by_name(self, learner_name: str) -> Optional[Dict]:
        try:
            conn = self.get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT id, firstname, lastname, email FROM mdl_user WHERE CONCAT(firstname, ' ', lastname) = %s LIMIT 1", (learner_name,))
                return cur.fetchone()
        except Exception as e:
            print(f"[X] Error fetching learner: {e}")
            return None
    
    def fetch_user_info_data(self, user_id: int) -> Dict[str, str]:
        try:
            conn = self.get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT fid.id AS field_id, fid.name AS fieldname, ud.data FROM mdl_user_info_data ud JOIN mdl_user_info_field fid ON ud.fieldid = fid.id WHERE ud.userid = %s", (user_id,))
                rows = cur.fetchall()
                return {r["fieldname"]: r["data"] for r in rows} if rows else {}
        except Exception as e:
            print(f"[X] Error fetching user info: {e}")
            return {}
    
    def fetch_employer_fields(self) -> List[Dict]:
        try:
            conn = self.get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT id, name FROM mdl_user_info_field WHERE categoryid = 5")
                return cur.fetchall()
        except Exception as e:
            print(f"[X] Error fetching employer fields: {e}")
            return []
    
    def fetch_provider_data(self) -> Dict[str, str]:
        try:
            conn = self.get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT fid.name AS fieldname, ud.data FROM mdl_user_info_data ud JOIN mdl_user_info_field fid ON ud.fieldid = fid.id WHERE fid.categoryid = 6 AND COALESCE(ud.data, '') <> '' ORDER BY ud.userid, fid.id LIMIT 500")
                rows = cur.fetchall()
                provider_info = {}
                for r in rows:
                    fname = r["fieldname"]
                    val = r["data"]
                    if fname not in provider_info and val and str(val).strip():
                        provider_info[fname] = val
                return provider_info
        except Exception as e:
            print(f"[X] Error fetching provider data: {e}")
            return {}
    
    def fetch_section_modules(self):
        try:
            conn = self.get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT cm.id as coursemoduleid, cm.section as sectionid, cm.instance as moduleinstance, m.name as modulename, cs.section as sectionnumber, cs.name as sectionname FROM mdl_course_modules cm JOIN mdl_modules m ON cm.module = m.id JOIN mdl_course_sections cs ON cm.section = cs.id WHERE cs.course = 8 AND m.name = 'quiz' AND cm.instance IN (12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23) ORDER BY cs.section, cm.id")
                return cur.fetchall()
        except Exception as e:
            print(f"[X] Error fetching section modules: {e}")
            return []
    
    def fetch_results(self, learner_name: str):
        try:
            conn = self.get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT CONCAT(u.firstname, ' ', u.lastname) AS learner_name, q.id AS quiz_id, q.name AS topic_name, qa.sumgrades AS learner_score, q.sumgrades AS total_marks FROM mdl_quiz_attempts qa JOIN mdl_user u ON qa.userid = u.id JOIN mdl_quiz q ON qa.quiz = q.id WHERE CONCAT(u.firstname, ' ', u.lastname) = %s AND qa.quiz IN (12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23)", (learner_name,))
                return cur.fetchall()
        except Exception as e:
            print(f"[X] Error fetching results: {e}")
            return []
    
    def fetch_all_learner_data(self, learner_name: str) -> Optional[Dict]:
        learner = self.fetch_learner_by_name(learner_name)
        if not learner:
            return None
        user_id = learner["id"]
        profile = self.fetch_user_info_data(user_id)
        emp_fields = self.fetch_employer_fields()
        provider_info = self.fetch_provider_data()
        section_modules = self.fetch_section_modules()
        quiz_section_map = {m['moduleinstance']: {'section_number': m['sectionnumber'], 'section_name': m['sectionname']} for m in section_modules}
        results = self.fetch_results(learner_name)
        return {
            'learner': learner,
            'profile': profile,
            'provider_info': provider_info,
            'section_1_name': "Knowledge Modules",
            'quiz_section_map': quiz_section_map,
            'results': results,
            'emp_fields': emp_fields
        }

# Create database manager instance
db = DatabaseManager()