import Nullstack from 'nullstack'

import React from 'react'
import ReactDOM from 'react-dom/server'

interface CreatePluginOptions {
  renderWrapper: (component: any, attributes: any) => any
}

export function createPlugin(options: CreatePluginOptions) {
  class ReactEntrypoint extends Nullstack {
    render(context) {
      return renderWrapper(context.Component, context)
    }

}

  const { renderWrapper } = options
  function checkIfReact(node) {
    if (Object.keys(node.type || {}).includes('__useReact') && !node.type.__useReact) return

    if (typeof node.type === 'object') {
      const $$typeof = node.type.$$typeof
      return $$typeof && $$typeof.toString().slice('Symbol('.length).startsWith('react')
    }
    if (typeof node.type !== 'function') return false
    if (node.type.prototype != null && typeof node.type.prototype.render === 'function') {
      return React.Component.isPrototypeOf(node.type) || React.PureComponent.isPrototypeOf(node.type)
    }

    let _error = null
    function Tester(...args) {
      try {
        const vnode = node.type(...args)
        node.type.__useReact = vnode && vnode.$$typeof === reactTypeof
      } catch (err) {
        if (!errorIsComingFromPreactComponent(err)) {
          _error = err
          node.type.__useReact = false
        }
      }

      return React.createElement('div')
    }

    if (!node.type.__useReact) {
      tryReactRender(Tester, node.attributes, node.children)
    }

    if (node.type.__useReact && !node.type.__useReactInstance) {
      const Component = node.type
      node.type.__useReactInstance = class extends ReactEntrypoint {

        render(context) {
          return renderWrapper(Component, context)
        }
      }
    }

    if (node.type.__useReactInstance) {
      node.type = node.type.__useReactInstance
    }
  }

  const reactTypeof = Symbol.for('react.element')

  function errorIsComingFromPreactComponent(err) {
    return (
      err.message && (err.message.startsWith("Cannot read property '__H'") || err.message.includes("(reading '__H')"))
    )
  }

  function tryReactRender(Component, props, children) {
    const vnode = React.createElement(Component, { ...props, children })
    try {
      ReactDOM.renderToString(vnode)
    } catch (e) {}
  }

  return (options2) => {
    const { node } = options2

    if (node && Array.isArray(node.children)) {
      node.children?.forEach(checkIfReact)
    }
  }
}
