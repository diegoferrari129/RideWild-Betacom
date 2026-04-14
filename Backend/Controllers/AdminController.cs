using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RideWild.DTO;
using RideWild.Models.AdventureModels;
using RideWild.Models.DataModels;

namespace RideWild.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AdventureWorksLt2019Context _context;
        private readonly AdventureWorksDataContext _contexData;

        public AdminController(AdventureWorksLt2019Context context, AdventureWorksDataContext contextData)
        {
            _context = context;
            _contexData = contextData;
        }

        /*
        * GET: api/admin/get-all-customers
        * A verified admin can access to all information about the customers
        */
        [Authorize(Policy = "Admin")]
        [HttpGet("get-all-customers")]
        public async Task<ActionResult<IEnumerable<CustomerDTO>>> GetAllCustomers()
        {
            var customers = await _context.Customers
                .Select(c => new CustomerDTO
                {
                    NameStyle = c.NameStyle,
                    Title = c.Title,
                    FirstName = c.FirstName,
                    MiddleName = c.MiddleName,
                    LastName = c.LastName,
                    Suffix = c.Suffix,
                    CompanyName = c.CompanyName,
                    SalesPerson = c.SalesPerson,
                })
                .ToListAsync();
            return Ok(customers);
        }

        /*
        * GET: api/admin/get-customer/customerId
        * A verified admin can access to all information about the customer
        */
        [Authorize(Policy = "Admin")]
        [HttpGet("get-customer/{id}")]
        public async Task<ActionResult<CustomerDTO>> GetCustomerById(int id)
        {
            var customer = await _context.Customers
                .Where(c => c.CustomerId == id)
                .Select(c => new CustomerDTO
                {
                    NameStyle = c.NameStyle,
                    Title = c.Title,
                    FirstName = c.FirstName,
                    MiddleName = c.MiddleName,
                    LastName = c.LastName,
                    Suffix = c.Suffix,
                    CompanyName = c.CompanyName,
                    SalesPerson = c.SalesPerson,
                })
                .FirstOrDefaultAsync();
            if (customer == null)
            {
                return NotFound("Cliente non trovato");
            }
            return Ok(customer);
        }

        /*
        * GET: api/admin/get-addresses/customerId
        * A verified admin can access to all information about the customer
        */
        [Authorize(Policy = "Admin")]
        [HttpGet("get-addresses/{id}")]
        public async Task<ActionResult<List<AddressDTO>>> GetAddressesByCustomerId(int id)
        {
            var addresses = await _context.CustomerAddresses
                .Where(ca => ca.CustomerId == id)
                .Include(ca => ca.Address)
                .Select(ca => new AddressDTO
                {
                    AddressId = ca.AddressId,
                    AddressLine1 = ca.Address.AddressLine1,
                    AddressLine2 = ca.Address.AddressLine2,
                    City = ca.Address.City,
                    StateProvince = ca.Address.StateProvince,
                    CountryRegion = ca.Address.CountryRegion,
                    PostalCode = ca.Address.PostalCode,
                    AddressType = ca.AddressType
                })
                .ToListAsync();
            return Ok(addresses);
        }

        /*
         * GET: api/admin/get-customers-filtered
         * A verified admin can access to all customers and filtered them
        */
        [Authorize(Policy = "Admin")]
        [HttpGet("get-customers-filtered")]
        public async Task<IActionResult> GetCustomersFiltered(
        int page = 1,
        int size = 10,
        string? sort = "firstname,asc",
        string? search = ""
        )
        {
            var query = _context.Customers
                .Include(c => c.CustomerAddresses)
                .ThenInclude(ca => ca.Address)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(c =>
                    c.FirstName.ToLower().Contains(lowered) ||
                    c.LastName.ToLower().Contains(lowered) ||
                    c.CustomerAddresses.Any(ca => 
                        ca.Address.CountryRegion.ToLower().Contains(lowered) ||
                        ca.Address.City.ToLower().Contains(lowered) ||
                        ca.Address.StateProvince.ToLower().Contains(lowered))
                );
            }

            if (!string.IsNullOrEmpty(sort))
            {
                var parts = sort.Split(',');
                var field = parts[0];
                var direction = parts.Length > 1 ? parts[1] : "asc";

                query = field switch
                {
                    "firstname" => direction == "desc" ? query.OrderByDescending(c => c.FirstName) : query.OrderBy(c => c.FirstName),
                    "lastname" => direction == "desc" ? query.OrderByDescending(c => c.LastName) : query.OrderBy(c => c.LastName),
                    _ => query.OrderBy(c => c.CustomerId)
                };
            }

            var totalItems = await query.CountAsync();

            var customers = await query
                .Skip((page - 1) * size)
                .Take(size)
                .Select(c=> new
                {
                    c.CustomerId,
                    c.FirstName,
                    c.LastName,
                    Addresses = c.CustomerAddresses.Select(ca => new
                    {
                        ca.AddressType,
                        ca.Address.AddressLine1,
                        ca.Address.City,
                        ca.Address.CountryRegion,
                        ca.Address.StateProvince
                    })
                })
                .ToListAsync();

            return Ok(new
            {
                data = customers,
                totalItems
            });
        }
    }
}
