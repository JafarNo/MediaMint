from .utils import *
from ..routers.auth import get_current_user
from fastapi import status
from ..firebase_db import TodosDB

app.dependency_overrides[get_current_user] = override_get_current_user

def test_admin_read_all_authenticated(test_todo):
    response = client.get("/admin/todo")
    assert response.status_code == status.HTTP_200_OK
    # Check that response contains our test todo
    todos = response.json()
    assert len(todos) >= 1
    assert any(t['title'] == 'Learn to code!' for t in todos)


def test_admin_delete_todo(test_todo):
    todo_id = test_todo['id']
    response = client.delete(f"/admin/todo/{todo_id}")
    assert response.status_code == 204

    model = TodosDB.get_by_id(todo_id)
    assert model is None


def test_admin_delete_todo_not_found():
    response = client.delete("/admin/todo/nonexistent_id_9999")
    assert response.status_code == 404
    assert response.json() == {'detail': 'Todo not found.'}










