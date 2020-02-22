import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import './style.scss'
import Main from './components/Main'


class App extends React.Component {
  constructor(){
    super()

    this.state = {
    }
  }

  componentDidMount() {

  }



  render() {
    return (

      <Router>
        <main>

          <Switch>
            <Route path="/" component={Main} />

          </Switch>

        </main>

      </Router>


    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
)
