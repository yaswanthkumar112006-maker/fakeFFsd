# Problem Statement :  Asset & Resource Allocation Management System

Organizations often rely on manual or fragmented systems for managing assets and resources such as computers, equipment, and office infrastructure. This leads to inefficient utilization, lack of transparency, delayed approvals, and poor tracking of asset allocation and maintenance.
The goal of this project is to develop a centralized web-based system that enables efficient tracking, allocation, approval, and maintenance of organizational assets while providing clear role-based access and accountability.

# Identified Actors    :

## User
A User represents any individual within the organization who requires assets or resources to perform their duties. The User interacts with the system primarily to request resources, receive updates related to their requests, and communicate issues with allocated assets. This role focuses on utilization rather than management or control.

## Staff
Staff members are responsible for the day-to-day operational handling of assets. They ensure that assets are properly recorded, maintained, and allocated according to approved decisions. This role operates at the execution level and maintains accurate system records related to assets.

## Office Admin
The Office Admin acts as an intermediate authority between Users and higher-level decision-makers. This role oversees requests within a specific office, ensures compliance with organizational procedures, and forwards requests that require higher authorization.

## Higher Authority
The Higher Authority represents the top-level decision-making role in the system. This role is responsible for reviewing escalated requests, ensuring policy compliance, and providing final authorization. It does not perform operational or maintenance tasks.

## System Admin
The System Admin is responsible for system-level configuration, access control, and security management. This role manages users, roles, permissions, and ensures the reliability, integrity, and proper functioning of the system.


# Planned Features by Actor

## User  :
- Submit asset/resource requests
- View request status
- Receive allocation notifications
- Report asset-related issues
- Track issue resolution progress

## Staff  :
- Add new assets to the system
- Update asset details
- Allocate assets to users
- Record allocation details
- Perform asset maintenance
- Record maintenance history
- View office-wise asset availability
- Focused strictly on operational responsibilities

## Office Admin :
- View user-submitted requests
- Approve or reject requests
- Escalate requests to Higher Authority when required
- View request status and history
- Monitor office-wise asset availability

## Higher Authority :
- View escalated requests
- Approve or reject high-level requests
- View complete request history
- Track overall request status

## System Admin  :
- Assign roles and permissions
- Enable or disable user access
- Add, update, or delete users
- Create and manage offices
- Maintain system audit logs
