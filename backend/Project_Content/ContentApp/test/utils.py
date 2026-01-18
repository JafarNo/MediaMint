from ..main import app
from fastapi.testclient import TestClient
import pytest
from ..routers.auth import bcrypt_context
from ..firebase_db import TodosDB, UserDB


def override_get_current_user():
    return {'username': 'codingwithrobytest', 'id': 'test_user_1', 'user_role': 'admin'}

client = TestClient(app)

@pytest.fixture
def test_todo():
    todo_data = {
        'title': "Learn to code!",
        'description': "Need to learn everyday!",
        'priority': 5,
        'complete': False,
        'owner_id': 'test_user_1',
    }
    
    todo = TodosDB.create(todo_data)
    yield todo
    # Cleanup
    TodosDB.delete(todo['id'])


@pytest.fixture
def test_user():
    user_data = {
        'username': "codingwithrobytest",
        'email': "codingwithrobytest@email.com",
        'first_name': "Eric",
        'last_name': "Roby",
        'hashed_password': bcrypt_context.hash("testpassword"),
        'role': "admin",
        'phone_number': "(111)-111-1111"
    }
    
    user = UserDB.create(user_data)
    yield user
    # Cleanup
    UserDB.delete(user['id'])






