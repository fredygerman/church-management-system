# Phase 1 API Documentation

All endpoints require authentication via JWT token in the Authorization header.

## Church Management

### Create Church
```
POST /churches
Content-Type: application/json

{
  "workspaceId": "string",
  "name": "string",
  "location": "string",
  "leadPastorName": "string",
  "phone": "string (optional)",
  "email": "string (optional)",
  "description": "string (optional)"
}
```

### List Churches
```
GET /churches?workspaceId={workspaceId}
```

### Get Single Church
```
GET /churches/{id}
```

### Update Church
```
PUT /churches/{id}
Content-Type: application/json

{
  "name": "string (optional)",
  "location": "string (optional)",
  "leadPastorName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "description": "string (optional)"
}
```

### Delete Church
```
DELETE /churches/{id}
```

### Get Active Churches
```
GET /churches/workspace/{workspaceId}/active
```

---

## Members Management

### Create Member
```
POST /members
Content-Type: application/json

{
  "churchId": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string (optional)",
  "dateOfBirth": "Date (YYYY-MM-DD)",
  "gender": "male | female | others",
  "occupation": "string (optional)",
  "dateOfSalvation": "Date (optional)",
  "baptismStatus": "none | maji | roho_mtakatifu | both (default: none)",
  "maritalStatus": "single | married | divorced | widowed",
  "jumuiyaId": "string (optional)",
  "familyId": "string (optional)",
  "notes": "string (optional)"
}
```

### List Members
```
GET /members?churchId={churchId}
```

### Get Single Member
```
GET /members/{id}
```

### Update Member
```
PUT /members/{id}
Content-Type: application/json

{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "dateOfBirth": "Date (optional)",
  "gender": "male | female | others (optional)",
  "occupation": "string (optional)",
  "dateOfSalvation": "Date (optional)",
  "baptismStatus": "none | maji | roho_mtakatifu | both (optional)",
  "maritalStatus": "single | married | divorced | widowed (optional)",
  "notes": "string (optional)"
}
```

### Delete Member
```
DELETE /members/{id}
```

### Search Members
```
GET /members/search?churchId={churchId}&q={searchQuery}
```

### Get Members by Jumuiya
```
GET /members/jumuiya/{jumuiyaId}
```

### Get Members by Family
```
GET /members/family/{familyId}
```

### Assign Member to Jumuiya
```
POST /members/{id}/assign-jumuiya
Content-Type: application/json

{
  "jumuiyaId": "string"
}
```

### Link Member to Family
```
POST /members/{id}/link-family
Content-Type: application/json

{
  "familyId": "string"
}
```

---

## Zones/Jumuiya Management

### Create Zone
```
POST /zones
Content-Type: application/json

{
  "churchId": "string",
  "name": "string",
  "description": "string (optional)",
  "leaderId": "string (optional)",
  "meetingDay": "string (optional) - e.g., 'Monday', 'Wednesday'"
}
```

### List Zones
```
GET /zones?churchId={churchId}
```

### Get Single Zone
```
GET /zones/{id}
```

### Update Zone
```
PUT /zones/{id}
Content-Type: application/json

{
  "name": "string (optional)",
  "description": "string (optional)",
  "leaderId": "string (optional)",
  "meetingDay": "string (optional)"
}
```

### Delete Zone
```
DELETE /zones/{id}
```

### Assign Leader to Zone
```
POST /zones/{id}/assign-leader
Content-Type: application/json

{
  "leaderId": "string"
}
```

### Get Zones by Meeting Day
```
GET /zones/by-meeting-day?churchId={churchId}&meetingDay={meetingDay}
```

---

## Families Management

### Create Family
```
POST /families
Content-Type: application/json

{
  "churchId": "string",
  "familyName": "string"
}
```

### List Families
```
GET /families?churchId={churchId}
```

### Get Single Family
```
GET /families/{id}
```

### Update Family
```
PUT /families/{id}
Content-Type: application/json

{
  "familyName": "string (optional)"
}
```

### Delete Family
```
DELETE /families/{id}
```

---

## Visitors (Wageni) Management

### Create Visitor
```
POST /visitors
Content-Type: application/json

{
  "churchId": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string (optional)",
  "email": "string (optional)",
  "visitDate": "Date (optional) - defaults to today"
}
```

### List Visitors
```
GET /visitors?churchId={churchId}
```

### Get Single Visitor
```
GET /visitors/{id}
```

### Update Visitor
```
PUT /visitors/{id}
Content-Type: application/json

{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "visitDate": "Date (optional)"
}
```

### Delete Visitor
```
DELETE /visitors/{id}
```

### Get Visitors by Status
```
GET /visitors/status/{status}?churchId={churchId}
Status options: none | called | visited | converted | dropped
```

### Create Visitor Followup
```
POST /visitors/{id}/followup
Content-Type: application/json

{
  "status": "called | visited | converted | dropped",
  "notes": "string (optional)",
  "followupDate": "Date (optional)",
  "completedBy": "string (optional) - User ID"
}
```

### Get Visitor Followup History
```
GET /visitors/{id}/followups
```

### Get Latest Followup Status
```
GET /visitors/{id}/latest-followup
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequestException"
}
```

Common errors:
- `400 Bad Request` - Missing or invalid parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions (e.g., Branch Admin accessing wrong church)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Church Context

The `ChurchContextGuard` ensures data isolation:
- **Super Admin**: Can access all churches. Can omit `church_id` or include it in queries.
- **Branch Admin**: Can only access their assigned church. If they try to access another church, they get a 403 Forbidden error.

To specify a church context, include `church_id` in:
1. Query parameters: `?church_id={churchId}`
2. Request body: `{ "churchId": "{churchId}", ... }`
3. User's default church (if no explicit context provided)

---

**Last Updated:** January 4, 2026
