import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './index.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalBookings: 0,
        availableSlots: 0,
        totalUsers: 0,
        totalRevenue: 0,
    });
    const [bookings, setBookings] = useState([]);
    const [parkingLot, setParkingLot] = useState(null);
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editedParkingLot, setEditedParkingLot] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    
    // Reference to store interval ID
    const pollingIntervalRef = useRef(null);
    
    const adminDetails = JSON.parse(localStorage.getItem('adminDetails'));

    // Set up polling for parking lot data
    useEffect(() => {
        // Clear any existing interval when component unmounts or dependencies change
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Handle auto-refresh toggle
    useEffect(() => {
        if (activeTab === 'parking-lots' && isAutoRefresh) {
            // Set up polling every 10 seconds
            pollingIntervalRef.current = setInterval(() => {
                refreshParkingLotData();
            }, 10000); // 10 seconds
            
            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        } else if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
    }, [activeTab, isAutoRefresh]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('https://admin-backend-2-0pa4.onrender.com/api/admin/stats', {
                    headers: {
                        Authorization: `Bearer ${Cookies.get('admin_jwt_token')}`,
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setStats(data);
                } else {
                    console.error('Failed to fetch stats:', data.error);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        const fetchBookings = async () => {
            try {
                const response = await fetch('https://admin-backend-2-0pa4.onrender.com/api/admin/bookings', {
                    headers: {
                        Authorization: `Bearer ${Cookies.get('admin_jwt_token')}`,
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setBookings(data);
                } else {
                    console.error('Failed to fetch bookings:', data.error);
                }
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };

        const fetchParkingLot = async () => {
            try {
                console.log('Fetching parking lot data...');
                const response = await fetch('https://admin-backend-2-0pa4.onrender.com/api/admin/parking-lot', {
                    headers: {
                        Authorization: `Bearer ${Cookies.get('admin_jwt_token')}`,
                    },
                });
                const data = await response.json();
                console.log('Parking lot API response:', response.status, data);
                
                if (response.ok && data) {
                    setParkingLot(data);
                    setEditedParkingLot(data);
                } else {
                    console.error('Failed to fetch parking lot:', data.error);
                }
            } catch (error) {
                console.error('Error fetching parking lot:', error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await fetch('https://admin-backend-2-0pa4.onrender.com/api/admin/users', {
                    headers: {
                        Authorization: `Bearer ${Cookies.get('admin_jwt_token')}`,
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setUsers(data);
                } else {
                    console.error('Failed to fetch users:', data.error);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchStats();
        if (activeTab === 'bookings') {
            fetchBookings();
        }
        if (activeTab === 'parking-lots') {
            fetchParkingLot();
        }
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    // Add a refresh function to manually fetch the latest data
    const refreshParkingLotData = async () => {
        try {
            const response = await fetch('https://admin-backend-2-0pa4.onrender.com/api/admin/parking-lot', {
                headers: {
                    Authorization: `Bearer ${Cookies.get('admin_jwt_token')}`,
                },
            });
            const data = await response.json();
            
            if (response.ok) {
                // Check if available_slots has changed
                const slotsChanged = parkingLot && parkingLot.available_slots !== data.available_slots;
                
                setParkingLot(data);
                setEditedParkingLot(data);
                setLastUpdated(new Date());
                
                // If slots changed, add a class for animation
                if (slotsChanged) {
                    const slotElement = document.querySelector('.highlight-slot');
                    if (slotElement) {
                        slotElement.classList.add('updated');
                        setTimeout(() => {
                            slotElement.classList.remove('updated');
                        }, 2000);
                    }
                }
            } else {
                console.error('Failed to refresh parking lot:', data.error);
            }
        } catch (error) {
            console.error('Error refreshing parking lot:', error);
        }
    };

    // Toggle auto-refresh
    const toggleAutoRefresh = () => {
        setIsAutoRefresh(!isAutoRefresh);
    };

    const handleLogout = () => {
        Cookies.remove('admin_jwt_token');
        localStorage.removeItem('adminDetails');
        navigate('/admin/login');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Handle different data types appropriately
        let processedValue = value;
        if (name === 'total_slots' || name === 'available_slots') {
            processedValue = parseInt(value);
        } else if (name === 'price_per_hour' || name === 'latitude' || name === 'longitude') {
            processedValue = parseFloat(value);
        } else if (name === 'is_active') {
            processedValue = e.target.checked;
        }
        
        setEditedParkingLot({
            ...editedParkingLot,
            [name]: processedValue
        });
    };
    
    const handleSave = async () => {
        try {
            const response = await fetch('https://admin-backend-2-0pa4.onrender.com/api/admin/parking-lot', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${Cookies.get('admin_jwt_token')}`,
                },
                body: JSON.stringify(editedParkingLot),
            });
            
            const data = await response.json();
            if (response.ok) {
                setParkingLot(editedParkingLot);
                setIsEditing(false);
                alert('Parking lot details updated successfully!');
            } else {
                console.error('Failed to update parking lot:', data.error);
                alert(`Failed to update: ${data.error}`);
            }
        } catch (error) {
            console.error('Error updating parking lot:', error);
            alert('Error updating parking lot. Please try again.');
        }
    };
    
    const handleCancel = () => {
        setEditedParkingLot(parkingLot);
        setIsEditing(false);
    };
    
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString;
    };

    const handleCreateParkingLot = async () => {
        try {
            const newParkingLot = {
                parking_lot_name: "New Parking Lot",
                total_slots: 50,
                available_slots: 50,
                price_per_hour: 50,
                opening_time: "08:00:00",
                closing_time: "20:00:00",
                is_active: true,
                state: "",
                district: "",
                area: "",
                address: ""
            };
            
            const response = await fetch('https://admin-backend-2-0pa4.onrender.com/api/admin/parking-lot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${Cookies.get('admin_jwt_token')}`,
                },
                body: JSON.stringify(newParkingLot),
            });
            
            const data = await response.json();
            if (response.ok) {
                setParkingLot(data);
                setEditedParkingLot(data);
                setIsCreating(false);
                alert('Parking lot created successfully!');
            } else {
                console.error('Failed to create parking lot:', data.error);
                alert(`Failed to create: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating parking lot:', error);
            alert('Error creating parking lot. Please try again.');
        }
    };

    const renderOverview = () => (
        <div className="dashboard-content">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <i className="fas fa-car"></i>
                    <div className="stat-info">
                        <h3>Total Bookings</h3>
                        <p>{stats.totalBookings}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <i className="fas fa-parking"></i>
                    <div className="stat-info">
                        <h3>Available Slots</h3>
                        <p>{stats.availableSlots}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <i className="fas fa-users"></i>
                    <div className="stat-info">
                        <h3>Total Users</h3>
                        <p>{stats.totalUsers}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <i className="fas fa-money-bill-wave"></i>
                    <div className="stat-info">
                        <h3>Revenue</h3>
                        <p>₹{stats.totalRevenue}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBookings = () => (
        <div className="dashboard-content">
            <h2>Manage Bookings</h2>
            <div className="bookings-table">
                {bookings.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>User ID</th>
                                <th>Slot Number</th>
                                <th>Booked Date</th>
                                <th>Car Number</th>
                                <th>Arrival Time</th>
                                <th>Departed Time</th>
                                <th>Amount Paid</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.booking_id}>
                                    <td>{booking.booking_id}</td>
                                    <td>{booking.user_id}</td>
                                    <td>{booking.slot_number}</td>
                                    <td>{booking.booked_date}</td>
                                    <td>{booking.car_number}</td>
                                    <td>{booking.actual_arrival_time || 'N/A'}</td>
                                    <td>{booking.actual_departed_time || 'N/A'}</td>
                                    <td>₹{booking.amount_paid || '0.00'}</td>
                                    <td>
                                        <button>Edit</button>
                                        <button>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No bookings found</p>
                )}
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="dashboard-content">
            <h2>User Management</h2>
            <div className="users-table">
                {users.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Driver Name</th>
                                <th>Aadhar Number</th>
                                <th>Phone Number</th>
                                <th>Booking ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.first_name}</td>
                                    <td>{user.last_name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.driver_name || 'N/A'}</td>
                                    <td>{user.aadhar_number || 'N/A'}</td>
                                    <td>{user.phone_number || 'N/A'}</td>
                                    <td>{user.booking_id || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No users found</p>
                )}
            </div>
        </div>
    );

    const renderParkingLots = () => (
        <div className="dashboard-content">
            <div className="section-header">
                <h2>Parking Lots</h2>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={refreshParkingLotData}>
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                    <div className="auto-refresh-toggle">
                        <label className="toggle-label">
                            <input 
                                type="checkbox" 
                                checked={isAutoRefresh} 
                                onChange={toggleAutoRefresh} 
                            />
                            <span className="toggle-text">Auto-refresh</span>
                        </label>
                    </div>
                    <span className="last-updated">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                </div>
            </div>
            
            {parkingLot ? (
                <div className="parking-lot-details">
                    {isEditing ? (
                        <div className="edit-form">
                            <h3>Edit Parking Lot Details</h3>
                            
                            <div className="form-section">
                                <h4>Basic Information</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Location ID:</label>
                                        <input 
                                            type="text" 
                                            name="location_id" 
                                            value={editedParkingLot.location_id} 
                                            disabled 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Parking Lot Name:</label>
                                        <input 
                                            type="text" 
                                            name="parking_lot_name" 
                                            value={editedParkingLot.parking_lot_name || ''} 
                                            onChange={handleInputChange} 
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Address:</label>
                                    <textarea 
                                        name="address" 
                                        value={editedParkingLot.address || ''} 
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>State:</label>
                                        <input 
                                            type="text" 
                                            name="state" 
                                            value={editedParkingLot.state || ''} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>District:</label>
                                        <input 
                                            type="text" 
                                            name="district" 
                                            value={editedParkingLot.district || ''} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Area:</label>
                                        <input 
                                            type="text" 
                                            name="area" 
                                            value={editedParkingLot.area || ''} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Contact Number:</label>
                                        <input 
                                            type="text" 
                                            name="contact_number" 
                                            value={editedParkingLot.contact_number || ''} 
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>URL:</label>
                                        <input 
                                            type="text" 
                                            name="url" 
                                            value={editedParkingLot.url || ''} 
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-section">
                                <h4>Capacity & Pricing</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Total Slots:</label>
                                        <input 
                                            type="number" 
                                            name="total_slots" 
                                            value={editedParkingLot.total_slots} 
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Available Slots:</label>
                                        <input 
                                            type="number" 
                                            name="available_slots" 
                                            value={editedParkingLot.available_slots} 
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            max={editedParkingLot.total_slots}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Price Per Hour (₹):</label>
                                        <input 
                                            type="number" 
                                            name="price_per_hour" 
                                            value={editedParkingLot.price_per_hour || ''} 
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-section">
                                <h4>Operating Hours</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Opening Time:</label>
                                        <input 
                                            type="time" 
                                            name="opening_time" 
                                            value={editedParkingLot.opening_time || ''} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Closing Time:</label>
                                        <input 
                                            type="time" 
                                            name="closing_time" 
                                            value={editedParkingLot.closing_time || ''} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-section">
                                <h4>Location Coordinates</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Latitude:</label>
                                        <input 
                                            type="number" 
                                            name="latitude" 
                                            value={editedParkingLot.latitude || ''} 
                                            onChange={handleInputChange}
                                            step="0.000001"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Longitude:</label>
                                        <input 
                                            type="number" 
                                            name="longitude" 
                                            value={editedParkingLot.longitude || ''} 
                                            onChange={handleInputChange}
                                            step="0.000001"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-section">
                                <h4>Status & Authentication</h4>
                                <div className="form-row">
                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                name="is_active" 
                                                checked={editedParkingLot.is_active} 
                                                onChange={handleInputChange}
                                            />
                                            Active Status
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Username:</label>
                                        <input 
                                            type="text" 
                                            name="user_name" 
                                            value={editedParkingLot.user_name || ''} 
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password:</label>
                                        <input 
                                            type="password" 
                                            name="password" 
                                            value={editedParkingLot.password || ''} 
                                            onChange={handleInputChange}
                                            placeholder="Enter new password"
                                        />
                                        <small>Leave blank to keep current password</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button className="save-btn" onClick={handleSave}>Save Changes</button>
                                <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="parking-info">
                            <div className="info-card">
                                <div className="info-header">
                                    <i className="fas fa-building"></i>
                                    <h3>Basic Information</h3>
                                </div>
                                <div className="info-body">
                                    <p><strong>ID:</strong> {parkingLot.location_id}</p>
                                    <p><strong>Name:</strong> {parkingLot.parking_lot_name || 'N/A'}</p>
                                    <p><strong>Address:</strong> {parkingLot.address || 'N/A'}</p>
                                    <p><strong>Area:</strong> {parkingLot.area || 'N/A'}</p>
                                    <p><strong>District:</strong> {parkingLot.district || 'N/A'}</p>
                                    <p><strong>State:</strong> {parkingLot.state || 'N/A'}</p>
                                    <p><strong>Contact:</strong> {parkingLot.contact_number || 'N/A'}</p>
                                    {parkingLot.url && (
                                        <p><strong>Website:</strong> <a href={parkingLot.url} target="_blank" rel="noopener noreferrer">{parkingLot.url}</a></p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="info-card">
                                <div className="info-header">
                                    <i className="fas fa-parking"></i>
                                    <h3>Capacity & Hours</h3>
                                </div>
                                <div className="info-body">
                                    <p><strong>Total Slots:</strong> {parkingLot.total_slots}</p>
                                    <p className="highlight-slot"><strong>Available Slots:</strong> {parkingLot.available_slots}</p>
                                    <p><strong>Occupied Slots:</strong> {parkingLot.total_slots - parkingLot.available_slots}</p>
                                    <p><strong>Price Per Hour:</strong> ₹{parkingLot.price_per_hour}</p>
                                    <p><strong>Opening Time:</strong> {formatTime(parkingLot.opening_time)}</p>
                                    <p><strong>Closing Time:</strong> {formatTime(parkingLot.closing_time)}</p>
                                    <p><strong>Status:</strong> <span className={parkingLot.is_active ? "status-active" : "status-inactive"}>
                                        {parkingLot.is_active ? 'Active' : 'Inactive'}
                                    </span></p>
                                </div>
                            </div>
                            
                            {(parkingLot.latitude || parkingLot.longitude) && (
                                <div className="info-card">
                                    <div className="info-header">
                                        <i className="fas fa-map-marked-alt"></i>
                                        <h3>Location Coordinates</h3>
                                    </div>
                                    <div className="info-body">
                                        <p><strong>Latitude:</strong> {parkingLot.latitude || 'N/A'}</p>
                                        <p><strong>Longitude:</strong> {parkingLot.longitude || 'N/A'}</p>
                                        <div className="map-link">
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${parkingLot.latitude},${parkingLot.longitude}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="map-btn"
                                            >
                                                <i className="fas fa-map"></i> View on Google Maps
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                <i className="fas fa-edit"></i> Edit Parking Lot
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="no-parking-lot">
                    <p>No parking lot details found</p>
                    <button className="create-btn" onClick={() => setIsCreating(true)}>
                        <i className="fas fa-plus"></i> Create New Parking Lot
                    </button>
                    
                    {isCreating && (
                        <div className="edit-form">
                            <h3>Create New Parking Lot</h3>
                            
                            <div className="form-section">
                                <h4>Basic Information</h4>
                                <div className="form-group">
                                    <label>Parking Lot Name:</label>
                                    <input 
                                        type="text" 
                                        name="parking_lot_name" 
                                        value={editedParkingLot?.parking_lot_name || "New Parking Lot"} 
                                        onChange={handleInputChange} 
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Address:</label>
                                    <textarea 
                                        name="address" 
                                        value={editedParkingLot?.address || ""} 
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>State:</label>
                                        <input 
                                            type="text" 
                                            name="state" 
                                            value={editedParkingLot?.state || ""} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>District:</label>
                                        <input 
                                            type="text" 
                                            name="district" 
                                            value={editedParkingLot?.district || ""} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Area:</label>
                                        <input 
                                            type="text" 
                                            name="area" 
                                            value={editedParkingLot?.area || ""} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-section">
                                <h4>Capacity & Pricing</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Total Slots:</label>
                                        <input 
                                            type="number" 
                                            name="total_slots" 
                                            value={editedParkingLot?.total_slots || 50} 
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Available Slots:</label>
                                        <input 
                                            type="number" 
                                            name="available_slots" 
                                            value={editedParkingLot?.available_slots || 50} 
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Price Per Hour (₹):</label>
                                        <input 
                                            type="number" 
                                            name="price_per_hour" 
                                            value={editedParkingLot?.price_per_hour || 50} 
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-section">
                                <h4>Operating Hours</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Opening Time:</label>
                                        <input 
                                            type="time" 
                                            name="opening_time" 
                                            value={editedParkingLot?.opening_time || "08:00"} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Closing Time:</label>
                                        <input 
                                            type="time" 
                                            name="closing_time" 
                                            value={editedParkingLot?.closing_time || "20:00"} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button className="save-btn" onClick={handleCreateParkingLot}>Create Parking Lot</button>
                                <button className="cancel-btn" onClick={() => setIsCreating(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderSettings = () => (
        <div className="dashboard-content">
            <h2>Settings</h2>
            <div className="settings-form">
                <p>Settings options will be available soon</p>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <img 
                        src="https://res.cloudinary.com/dcgmeefn2/image/upload/v1740811794/car_moving_iqyr65.jpg" 
                        alt="Park Smart Admin" 
                        className="nav-logo"
                    />
                    <h1>Park Smart Admin</h1>
                </div>
                <div className="nav-user">
                    <span>{adminDetails?.username || 'Admin'}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-container">
                <aside className="sidebar">
                    <button 
                        className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-chart-line"></i>
                        Overview
                    </button>
                    <button 
                        className={`sidebar-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        <i className="fas fa-calendar-alt"></i>
                        Bookings
                    </button>
                    <button 
                        className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <i className="fas fa-users"></i>
                        Users
                    </button>
                    <button 
                        className={`sidebar-btn ${activeTab === 'parking-lots' ? 'active' : ''}`}
                        onClick={() => setActiveTab('parking-lots')}
                    >
                        <i className="fas fa-parking"></i>
                        Parking Lots
                    </button>
                    <button 
                        className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <i className="fas fa-cog"></i>
                        Settings
                    </button>
                </aside>

                <main className="main-content">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'bookings' && renderBookings()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'parking-lots' && renderParkingLots()}
                    {activeTab === 'settings' && renderSettings()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard; 