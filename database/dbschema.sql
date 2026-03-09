CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL
);

CREATE TABLE role_permissions (
    role_permission_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    permission_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(120) UNIQUE,
    password VARCHAR(255),
    role_id INT,
    department_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE resource_types (
    resource_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100),
    managing_department_id INT,
    FOREIGN KEY (managing_department_id) REFERENCES departments(department_id)
);

CREATE TABLE resource_thresholds (
    threshold_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT,
    resource_type_id INT,
    threshold_value INT,
    UNIQUE(department_id, resource_type_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id)
);

CREATE TABLE procurement_requests (
    procurement_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT,
    resource_type_id INT,
    resource_name VARCHAR(100),
    quantity INT,
    requested_by INT,
    status VARCHAR(50),
    request_date TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id),
    FOREIGN KEY (requested_by) REFERENCES users(user_id)
);

CREATE TABLE procurement_items (
    procurement_item_id INT AUTO_INCREMENT PRIMARY KEY,
    procurement_id INT,
    resource_type_id INT,
    quantity INT,
    vendor_name VARCHAR(100),
    invoice_number VARCHAR(100),
    purchase_date DATE,
    warranty VARCHAR(100),
    FOREIGN KEY (procurement_id) REFERENCES procurement_requests(procurement_id),
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id)
);

CREATE TABLE resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    resource_code VARCHAR(100) UNIQUE,
    procurement_item_id INT,
    resource_type_id INT,
    department_id INT,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(100),
    condition_status VARCHAR(50),
    status VARCHAR(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (procurement_item_id) REFERENCES procurement_items(procurement_item_id),
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    department_id INT,
    resource_type_id INT,
    requested_resource_name VARCHAR(100),
    quantity INT,
    reason TEXT,
    status VARCHAR(50),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id)
);

CREATE TABLE allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT,
    resource_id INT,
    allocated_to INT,
    allocated_by INT,
    allocation_date DATE,
    status VARCHAR(50),
    FOREIGN KEY (request_id) REFERENCES requests(request_id),
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id),
    FOREIGN KEY (allocated_to) REFERENCES users(user_id),
    FOREIGN KEY (allocated_by) REFERENCES users(user_id)
);

CREATE TABLE return_requests (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT,
    user_id INT,
    return_request_date TIMESTAMP,
    status VARCHAR(50),
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE maintenance_requests (
    maintenance_id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT,
    requested_by INT,
    status VARCHAR(50),
    request_date TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id),
    FOREIGN KEY (requested_by) REFERENCES users(user_id)
);

CREATE TABLE scrap_resources (
    scrap_id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT,
    scrap_date DATE,
    reason TEXT,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id)
);

CREATE TABLE activity_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(50),
    related_id INT,
    created_by INT,
    action_by INT,
    action_role VARCHAR(50),
    action_type VARCHAR(50),
    remarks TEXT,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (action_by) REFERENCES users(user_id)
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT,
    type VARCHAR(50),
    related_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE system_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100),
    module_name VARCHAR(100),
    description TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
