import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { CSidebar, CSidebarBrand, CSidebarNav, CSidebarToggler, CImage } from '@coreui/react'

import logo from '../public/img/victron-logo-footer.svg'

import { AppSidebarNav } from './AppSidebarNav'

// sidebar nav config
import navigation from '../navigation'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  return (
    <CSidebar
      position="fixed"
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarBrand className="d-none d-md-flex" to="/">
        <CImage src={logo} width="80%" className="sidebar-brand-full" />
        <CImage src={logo} width="80%" className="sidebar-brand-narrow" />
      </CSidebarBrand>
      <CSidebarNav>
        <AppSidebarNav items={navigation} />
      </CSidebarNav>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
