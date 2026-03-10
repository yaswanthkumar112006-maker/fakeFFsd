CREATE TABLE DEPARTMENTS (
    department_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ROLES (
    role_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE PERMISSIONS (
    permission_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ROLE_PERMISSIONS (
    role_permission_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    UNIQUE(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES ROLES(role_id),
    FOREIGN KEY (permission_id) REFERENCES PERMISSIONS(permission_id)
);

CREATE TABLE USERS (
    user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department_id INT NULL,
    FOREIGN KEY (role_id) REFERENCES ROLES(role_id),
    FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id)
);

CREATE TABLE RESOURCE_TYPES (
    resource_type_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    UNIQUE(type_name, department_id),
    FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id)
);

CREATE TABLE RESOURCE_THRESHOLDS (
    threshold_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    resource_type_id INT NOT NULL UNIQUE,
    threshold_value INT NOT NULL,
    FOREIGN KEY (resource_type_id) REFERENCES RESOURCE_TYPES(resource_type_id)
);

CREATE TABLE PROCUREMENT_REQUESTS (
    procurement_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    resource_type_id INT NULL,
    proposed_resource_name VARCHAR(100) NULL,
    quantity INT NOT NULL,
    requested_by INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    request_date DATETIME NOT NULL,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id),
    FOREIGN KEY (resource_type_id) REFERENCES RESOURCE_TYPES(resource_type_id),
    FOREIGN KEY (requested_by) REFERENCES USERS(user_id)
);

CREATE TABLE PROCUREMENT_ITEMS (
    procurement_item_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    procurement_id INT NOT NULL,
    resource_type_id INT NOT NULL,
    quantity INT NOT NULL,
    vendor_name VARCHAR(100) NULL,
    invoice_number VARCHAR(100) UNIQUE,
    purchase_date DATE NULL,
    warranty VARCHAR(50) NULL,
    FOREIGN KEY (procurement_id) REFERENCES PROCUREMENT_REQUESTS(procurement_id),
    FOREIGN KEY (resource_type_id) REFERENCES RESOURCE_TYPES(resource_type_id)
);

CREATE TABLE RESOURCES (
    resource_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    resource_code VARCHAR(50) UNIQUE,
    procurement_item_id INT NULL,
    resource_type_id INT NOT NULL,
    department_id INT NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    manufacturer VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    location VARCHAR(100) NULL,
    condition_status VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL,
    FOREIGN KEY (procurement_item_id) REFERENCES PROCUREMENT_ITEMS(procurement_item_id),
    FOREIGN KEY (resource_type_id) REFERENCES RESOURCE_TYPES(resource_type_id),
    FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id)
);

CREATE TABLE REQUESTS (
    request_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department_id INT NOT NULL,
    resource_type_id INT NULL,
    requested_resource_name VARCHAR(100) NULL,
    quantity INT NOT NULL,
    reason TEXT NULL,
    status VARCHAR(20) NOT NULL,
    request_date DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id),
    FOREIGN KEY (resource_type_id) REFERENCES RESOURCE_TYPES(resource_type_id)
);

CREATE TABLE ALLOCATIONS (
    allocation_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    resource_id INT NOT NULL,
    allocated_to INT NOT NULL,
    allocated_by INT NOT NULL,
    allocation_date DATE NULL,
    status VARCHAR(20) NOT NULL,
    UNIQUE(resource_id, status),
    FOREIGN KEY (request_id) REFERENCES REQUESTS(request_id),
    FOREIGN KEY (resource_id) REFERENCES RESOURCES(resource_id),
    FOREIGN KEY (allocated_to) REFERENCES USERS(user_id),
    FOREIGN KEY (allocated_by) REFERENCES USERS(user_id)
);

CREATE TABLE RETURN_REQUESTS (
    return_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    user_id INT NOT NULL,
    return_request_date DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (resource_id) REFERENCES RESOURCES(resource_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE MAINTENANCE_REQUESTS (
    maintenance_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    requested_by INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    request_date DATETIME NOT NULL,
    FOREIGN KEY (resource_id) REFERENCES RESOURCES(resource_id),
    FOREIGN KEY (requested_by) REFERENCES USERS(user_id)
);

CREATE TABLE SCRAP_RESOURCES (
    scrap_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL UNIQUE,
    scrap_date DATE NULL,
    reason TEXT NULL,
    FOREIGN KEY (resource_id) REFERENCES RESOURCES(resource_id)
);

CREATE TABLE ACTIVITY_HISTORY (
    history_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(50) NOT NULL,
    related_id INT NULL,
    action_by INT NOT NULL,
    action_role VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    remarks TEXT NULL,
    action_time DATETIME NOT NULL,
    FOREIGN KEY (action_by) REFERENCES USERS(user_id)
);

CREATE TABLE NOTIFICATIONS (
    notification_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NULL,
    related_id INT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE SYSTEM_LOGS (
    log_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(100) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    description TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);
