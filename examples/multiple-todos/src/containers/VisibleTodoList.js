import { connect } from 'react-redux'
import TodoList from '../components/TodoList'

const mapStateToProps = (state, { todoApp }) => {
  console.warn('asdasdasdas', todoApp.getState())
  return {
    todos: todoApp.getVisibleTodos(),
    onTodoClick: todoApp.toggleTodo,
  }
}

const VisibleTodoList = connect(mapStateToProps)(TodoList)

export default VisibleTodoList
